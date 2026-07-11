import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { logEvent } from "../lib/analytics";
import { useUserStore } from "./userStore";
import {
  AiTask,
  EarnSummary,
  TaskCompletionResult,
  TaskKind,
  TopEarner,
  WalletTransaction,
} from "../types/tasks.types";
import { TASK_ECONOMY } from "../constants/taskEconomy";
import { LOCAL_MICROTASKS, LOCAL_ANNOTATION, LOCAL_SURVEYS, LocalTask } from "../data/aiTasksLocal";

const STORAGE_KEY = "@aha/earn-state/v1";

const todayStr = () => new Date().toISOString().split("T")[0];

/**
 * Offline/fallback earnings ledger — used only until migration 022 is live
 * (or when the network is down) so the hub always works. Once the backend
 * responds, the server wallet is the source of truth.
 */
interface LocalLedger {
  date: string;
  tasksToday: number;
  earnedTodayCents: number;
  adBatches: number;
  balanceCents: number;
  lifetimeCents: number;
  tasksTotal: number;
  streakDays: number;
  streakBest: number;
  streakDate: string | null;
  completedIds: string[];
  transactions: WalletTransaction[];
}

function emptyLedger(): LocalLedger {
  return {
    date: todayStr(),
    tasksToday: 0,
    earnedTodayCents: 0,
    adBatches: 0,
    balanceCents: 0,
    lifetimeCents: 0,
    tasksTotal: 0,
    streakDays: 0,
    streakBest: 0,
    streakDate: null,
    completedIds: [],
    transactions: [],
  };
}

function rolloverLedger(l: LocalLedger): LocalLedger {
  if (l.date === todayStr()) return l;
  return { ...l, date: todayStr(), tasksToday: 0, earnedTodayCents: 0, adBatches: 0 };
}

function emptySummary(): EarnSummary {
  return {
    wallet: {
      balanceCents: 0, pendingCents: 0, lifetimeCents: 0,
      taskCents: 0, surveyCents: 0, referralCents: 0, bonusCents: 0,
    },
    today: {
      tasksCompleted: 0, captchasCompleted: 0, earnedCents: 0, xpEarned: 0,
      adBatches: 0, allowedToday: TASK_ECONOMY.FREE_DAILY_TASKS,
    },
    weekCents: 0,
    monthCents: 0,
    streak: { current: 0, best: 0 },
    referrals: { total: 0, qualified: 0, pending: 0 },
    tasksCompletedTotal: 0,
    taskLevel: 1,
  };
}

function mapDbTask(r: any): AiTask {
  return {
    id: String(r.id),
    kind: r.kind,
    category: r.category ?? "microtask",
    title: r.title ?? "AI Task",
    description: r.description ?? "",
    difficulty: r.difficulty ?? "easy",
    rewardCents: Number(r.reward_cents) || 1,
    xp: Number(r.xp) || 1,
    estSeconds: Number(r.est_seconds) || 20,
    content: r.content ?? {},
    repeatable: !!r.repeatable,
    minTaskLevel: Number(r.min_task_level) || 1,
    requiredCourseId: r.required_course_id ?? null,
  };
}

function summaryFromLedger(l: LocalLedger): EarnSummary {
  const s = emptySummary();
  s.wallet.balanceCents = l.balanceCents;
  s.wallet.lifetimeCents = l.lifetimeCents;
  s.wallet.taskCents = l.lifetimeCents;
  s.today.tasksCompleted = l.tasksToday;
  s.today.earnedCents = l.earnedTodayCents;
  s.today.adBatches = l.adBatches;
  s.today.allowedToday =
    TASK_ECONOMY.FREE_DAILY_TASKS + l.adBatches * TASK_ECONOMY.BATCH_SIZE;
  s.streak = { current: l.streakDays, best: l.streakBest };
  s.tasksCompletedTotal = l.tasksTotal;
  s.weekCents = l.earnedTodayCents;
  s.monthCents = l.earnedTodayCents;
  return s;
}

interface EarnState {
  catalog: AiTask[];
  summary: EarnSummary;
  transactions: WalletTransaction[];
  topEarners: TopEarner[];
  completedIds: Set<string>;
  /** False until the 022 tables answered at least once. */
  backendAvailable: boolean;
  isLoading: boolean;
  hydrated: boolean;
  ledger: LocalLedger;

  hydrate: () => Promise<void>;
  loadHub: (userId: string) => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadTopEarners: (period: "week" | "month" | "all") => Promise<void>;

  /** Tasks available to run for one earning category. */
  getFeed: (kind: TaskKind) => AiTask[];
  tasksRemainingToday: () => number;

  completeTask: (task: AiTask, answer: any, durationMs: number) => Promise<TaskCompletionResult>;
  /** Call ONLY after a rewarded ad completed successfully. */
  unlockBatch: () => Promise<{ ok: boolean; error?: string }>;
  applyReferralCode: (code: string) => Promise<{ ok: boolean; error?: string }>;
}

async function persistLedger(l: LocalLedger) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(l));
  } catch {}
}

export const useEarnStore = create<EarnState>((set, get) => ({
  catalog: [],
  summary: emptySummary(),
  transactions: [],
  topEarners: [],
  completedIds: new Set(),
  backendAvailable: false,
  isLoading: false,
  hydrated: false,
  ledger: emptyLedger(),

  hydrate: async () => {
    if (get().hydrated) return;
    let ledger = emptyLedger();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) ledger = rolloverLedger({ ...emptyLedger(), ...JSON.parse(raw) });
    } catch {}
    set({
      ledger,
      hydrated: true,
      summary: summaryFromLedger(ledger),
      completedIds: new Set(ledger.completedIds),
      transactions: ledger.transactions,
    });
  },

  loadHub: async (userId) => {
    await get().hydrate();
    set({ isLoading: true });

    // Catalog — DB first, bundled samples as fallback.
    let catalog: AiTask[] = [];
    let backendAvailable = false;
    try {
      const { data, error } = await supabase
        .from("ai_tasks")
        .select("*")
        .eq("status", "published")
        .order("order_index", { ascending: true });
      if (!error && data && data.length > 0) {
        catalog = (data as any[]).map(mapDbTask);
        backendAvailable = true;
      }
    } catch {}
    if (!backendAvailable) {
      catalog = [...LOCAL_MICROTASKS, ...LOCAL_ANNOTATION, ...LOCAL_SURVEYS];
    }

    // Summary + completed tasks (server truth when available).
    let summary = get().summary;
    let completedIds = get().completedIds;
    if (backendAvailable) {
      try {
        const { data } = await (supabase as any).rpc("get_earn_summary");
        if (data?.ok) {
          summary = {
            wallet: {
              balanceCents: data.wallet.balance_cents ?? 0,
              pendingCents: data.wallet.pending_cents ?? 0,
              lifetimeCents: data.wallet.lifetime_cents ?? 0,
              taskCents: data.wallet.task_cents ?? 0,
              surveyCents: data.wallet.survey_cents ?? 0,
              referralCents: data.wallet.referral_cents ?? 0,
              bonusCents: data.wallet.bonus_cents ?? 0,
            },
            today: {
              tasksCompleted: data.today.tasks_completed ?? 0,
              captchasCompleted: data.today.captchas_completed ?? 0,
              earnedCents: data.today.earned_cents ?? 0,
              xpEarned: data.today.xp_earned ?? 0,
              adBatches: data.today.ad_batches ?? 0,
              allowedToday: data.today.allowed_today ?? TASK_ECONOMY.FREE_DAILY_TASKS,
            },
            weekCents: data.week_cents ?? 0,
            monthCents: data.month_cents ?? 0,
            streak: { current: data.streak?.current ?? 0, best: data.streak?.best ?? 0 },
            referrals: {
              total: data.referrals?.total ?? 0,
              qualified: data.referrals?.qualified ?? 0,
              pending: data.referrals?.pending ?? 0,
            },
            tasksCompletedTotal: data.tasks_completed_total ?? 0,
            taskLevel: data.task_level ?? 1,
          };
        }
      } catch {}
      try {
        const { data } = await supabase
          .from("ai_task_attempts")
          .select("task_id")
          .eq("user_id", userId);
        completedIds = new Set((data as any[])?.map((r) => String(r.task_id)) ?? []);
      } catch {}
    }

    set({ catalog, summary, completedIds, backendAvailable, isLoading: false });
  },

  loadTransactions: async () => {
    if (!get().backendAvailable) {
      set({ transactions: get().ledger.transactions });
      return;
    }
    try {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      set({
        transactions: ((data as any[]) ?? []).map((r) => ({
          id: String(r.id),
          amountCents: Number(r.amount_cents) || 0,
          type: r.type,
          status: r.status,
          description: r.description ?? "",
          createdAt: r.created_at,
        })),
      });
    } catch {}
  },

  loadTopEarners: async (period) => {
    if (!get().backendAvailable) return;
    try {
      const { data } = await (supabase as any).rpc("get_top_earners", { p_period: period });
      set({
        topEarners: ((data as any[]) ?? []).map((r) => ({
          userId: String(r.user_id),
          fullName: r.full_name ?? "Earner",
          avatarUrl: r.avatar_url ?? null,
          cents: Number(r.cents) || 0,
          tasks: Number(r.tasks) || 0,
        })),
      });
    } catch {}
  },

  getFeed: (kind) => {
    const { catalog, completedIds } = get();
    return catalog.filter(
      (t) => t.kind === kind && (t.repeatable || !completedIds.has(t.id))
    );
  },

  tasksRemainingToday: () => {
    const { today } = get().summary;
    return Math.max(0, today.allowedToday - today.tasksCompleted);
  },

  completeTask: async (task, answer, durationMs) => {
    const state = get();
    const fail = (error: string): TaskCompletionResult => ({
      ok: false, correct: false, rewardCents: 0, xp: 0,
      balanceCents: state.summary.wallet.balanceCents,
      tasksToday: state.summary.today.tasksCompleted,
      allowedToday: state.summary.today.allowedToday,
      taskLevel: state.summary.taskLevel,
      error,
    });

    if (state.tasksRemainingToday() <= 0) return fail("daily_limit");

    // ── Server path: validation + crediting happen in the RPC ──
    if (state.backendAvailable && !task.isLocal) {
      try {
        const nonce = `${task.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { data, error } = await (supabase as any).rpc("complete_ai_task", {
          p_task_id: task.id,
          p_answer: answer,
          p_duration_ms: Math.round(durationMs),
          p_client_nonce: nonce,
        });
        if (error || !data) return fail("Could not submit — check your connection");
        if (!data.ok) return fail(data.error ?? "Submission rejected");

        const summary = { ...state.summary };
        summary.wallet = { ...summary.wallet, balanceCents: data.balance_cents ?? summary.wallet.balanceCents };
        if (data.correct) {
          summary.wallet.lifetimeCents += data.reward_cents ?? 0;
          summary.today = {
            ...summary.today,
            tasksCompleted: data.tasks_today ?? summary.today.tasksCompleted + 1,
            earnedCents: summary.today.earnedCents + (data.reward_cents ?? 0),
            xpEarned: summary.today.xpEarned + (data.xp ?? 0),
          };
          summary.tasksCompletedTotal += 1;
          summary.taskLevel = data.task_level ?? summary.taskLevel;
          if (summary.streak.current === 0) summary.streak = { current: 1, best: Math.max(1, summary.streak.best) };
        }
        const completedIds = new Set(state.completedIds);
        if (!task.repeatable) completedIds.add(task.id);
        set({ summary, completedIds });

        // XP was credited server-side — mirror it in the local profile.
        if (data.correct && data.xp > 0) {
          const profile = useUserStore.getState().profile;
          if (profile) useUserStore.setState({ profile: { ...profile, xp: profile.xp + data.xp } });
        }
        logEvent("ai_task_complete", { task_id: task.id, kind: task.kind, correct: data.correct });
        return {
          ok: true,
          correct: !!data.correct,
          rewardCents: data.reward_cents ?? 0,
          xp: data.xp ?? 0,
          balanceCents: data.balance_cents ?? 0,
          tasksToday: data.tasks_today ?? 0,
          allowedToday: data.allowed_today ?? summary.today.allowedToday,
          taskLevel: data.task_level ?? summary.taskLevel,
        };
      } catch {
        return fail("Could not submit — check your connection");
      }
    }

    // ── Local fallback path (backend not live yet / offline) ──
    const local = task as LocalTask;
    let correct = true;
    if (local.localAnswer != null) {
      correct = Array.isArray(local.localAnswer)
        ? local.localAnswer.includes(answer?.choice)
        : answer?.choice === local.localAnswer;
    }
    // Captcha tasks are validated by the runner before calling completeTask.

    const ledger = rolloverLedger({ ...get().ledger });
    if (correct) {
      const today = todayStr();
      ledger.tasksToday += 1;
      ledger.earnedTodayCents += task.rewardCents;
      ledger.balanceCents += task.rewardCents;
      ledger.lifetimeCents += task.rewardCents;
      ledger.tasksTotal += 1;
      if (ledger.streakDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        ledger.streakDays = ledger.streakDate === yesterday ? ledger.streakDays + 1 : 1;
        ledger.streakBest = Math.max(ledger.streakBest, ledger.streakDays);
        ledger.streakDate = today;
      }
      const tx: WalletTransaction = {
        id: `local-tx-${Date.now()}`,
        amountCents: task.rewardCents,
        type: task.kind === "microtask" ? "task" : task.kind,
        status: "completed",
        description: task.title,
        createdAt: new Date().toISOString(),
      };
      ledger.transactions = [tx, ...ledger.transactions].slice(0, 100);
    }
    if (!task.repeatable && !ledger.completedIds.includes(task.id)) {
      ledger.completedIds.push(task.id);
    }
    persistLedger(ledger);

    const completedIds = new Set(get().completedIds);
    if (!task.repeatable) completedIds.add(task.id);
    set({ ledger, summary: summaryFromLedger(ledger), completedIds, transactions: ledger.transactions });

    if (correct && task.xp > 0) {
      const user = useUserStore.getState().profile;
      if (user) {
        useUserStore.getState().awardXP(user.id, task.xp, "ai_task", task.title);
      }
    }
    logEvent("ai_task_complete", { task_id: task.id, kind: task.kind, correct, local: true });
    const s = get().summary;
    return {
      ok: true,
      correct,
      rewardCents: correct ? task.rewardCents : 0,
      xp: correct ? task.xp : 0,
      balanceCents: s.wallet.balanceCents,
      tasksToday: s.today.tasksCompleted,
      allowedToday: s.today.allowedToday,
      taskLevel: s.taskLevel,
    };
  },

  unlockBatch: async () => {
    const state = get();
    if (state.summary.today.adBatches >= TASK_ECONOMY.MAX_AD_BATCHES) {
      return { ok: false, error: "You've unlocked all extra batches for today. Come back tomorrow!" };
    }
    if (state.backendAvailable) {
      try {
        const { data, error } = await (supabase as any).rpc("unlock_task_batch");
        if (error || !data?.ok) return { ok: false, error: data?.error ?? "Could not unlock — try again" };
        const summary = { ...state.summary };
        summary.today = {
          ...summary.today,
          adBatches: data.ad_batches,
          allowedToday: TASK_ECONOMY.FREE_DAILY_TASKS + data.ad_batches * TASK_ECONOMY.BATCH_SIZE,
        };
        set({ summary });
        logEvent("ai_task_batch_unlock", { batches: data.ad_batches });
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not unlock — check your connection" };
      }
    }
    const ledger = rolloverLedger({ ...state.ledger });
    ledger.adBatches += 1;
    persistLedger(ledger);
    set({ ledger, summary: summaryFromLedger(ledger) });
    logEvent("ai_task_batch_unlock", { batches: ledger.adBatches, local: true });
    return { ok: true };
  },

  applyReferralCode: async (code) => {
    if (!get().backendAvailable) {
      return { ok: false, error: "Referrals activate once you're online." };
    }
    try {
      const { data, error } = await (supabase as any).rpc("apply_referral_code", { p_code: code });
      if (error) return { ok: false, error: "Could not apply code" };
      if (!data?.ok) return { ok: false, error: data?.error ?? "Invalid code" };
      logEvent("referral_code_applied", {});
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not apply code" };
    }
  },
}));
