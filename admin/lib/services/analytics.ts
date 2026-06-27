import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

export interface DashboardStats {
  totalUsers: number;
  dailyActiveUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalJobs: number;
  publishedJobs: number;
  courseCompletions: number;
  quizPassRate: number; // 0–100
  adRevenueEstimate: number; // USD, derived
  avgSessionMinutes: number;
  retentionRate: number; // 0–100, 7-day
}

/**
 * Aggregates the dashboard cards from live tables using the service-role client.
 * Defensive: any missing table/column degrades that single metric to 0 rather
 * than failing the whole dashboard (the extension migration may not be applied
 * yet on a given environment).
 */
export const analyticsService = {
  async dashboard(): Promise<DashboardStats> {
    const admin = createAdminClient();

    const safeCount = async (table: string, build?: (q: any) => any): Promise<number> => {
      try {
        let q = admin.from(table).select("id", { count: "exact", head: true });
        if (build) q = build(q);
        const { count } = await q;
        return count ?? 0;
      } catch {
        return 0;
      }
    };

    const [totalUsers, totalCourses, publishedCourses, totalJobs, publishedJobs, courseCompletions] = await Promise.all([
      safeCount("profiles"),
      safeCount("courses"),
      safeCount("courses", (q) => q.eq("status", "published")),
      safeCount("jobs"),
      safeCount("jobs", (q) => q.eq("status", "published")),
      safeCount("user_progress", (q) => q.eq("status", "completed").not("lesson_id", "is", null)),
    ]);

    // DAU — distinct users with an event in the last 24h.
    let dailyActiveUsers = 0;
    try {
      const { data } = await admin.from("analytics_events").select("user_id").gte("created_at", daysAgoISO(1));
      dailyActiveUsers = new Set((data ?? []).map((r: any) => r.user_id).filter(Boolean)).size;
    } catch {}

    // Quiz pass rate — share of quiz_pass vs quiz attempts in analytics_events.
    let quizPassRate = 0;
    try {
      const { data } = await admin
        .from("analytics_events")
        .select("event")
        .in("event", ["quiz_pass", "quiz_fail", "quiz_attempt"]);
      const rows = data ?? [];
      const passes = rows.filter((r: any) => r.event === "quiz_pass").length;
      const attempts = rows.filter((r: any) => r.event !== "quiz_pass").length + passes;
      quizPassRate = attempts > 0 ? (passes / attempts) * 100 : 0;
    } catch {}

    // 7-day retention — users created >7d ago who were active in the last 7d.
    let retentionRate = 0;
    try {
      const { data: cohort } = await admin.from("profiles").select("id").lte("created_at", daysAgoISO(7));
      const cohortIds = new Set((cohort ?? []).map((r: any) => r.id));
      if (cohortIds.size > 0) {
        const { data: active } = await admin.from("analytics_events").select("user_id").gte("created_at", daysAgoISO(7));
        const retained = new Set(
          (active ?? []).map((r: any) => r.user_id).filter((id: string) => cohortIds.has(id))
        );
        retentionRate = (retained.size / cohortIds.size) * 100;
      }
    } catch {}

    // Ad-revenue estimate — coarse industry proxy (DAU × sessions × eCPM).
    // Replace with the AdMob/Meta reporting API when wired server-side.
    const adRevenueEstimate = Math.round(dailyActiveUsers * 3 * (4 / 1000) * 30 * 100) / 100;

    return {
      totalUsers,
      dailyActiveUsers,
      totalCourses,
      publishedCourses,
      totalJobs,
      publishedJobs,
      courseCompletions,
      quizPassRate,
      adRevenueEstimate,
      avgSessionMinutes: 0, // TODO: derive from paired session_start/session_end events.
      retentionRate,
    };
  },

  /** Most-popular published courses by completion count. */
  async popularCourses(limit = 5): Promise<{ course_id: string; completions: number }[]> {
    const admin = createAdminClient();
    try {
      const { data } = await admin.from("user_progress").select("course_id").eq("status", "completed");
      const tally = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        if (r.course_id) tally.set(r.course_id, (tally.get(r.course_id) ?? 0) + 1);
      });
      return [...tally.entries()]
        .map(([course_id, completions]) => ({ course_id, completions }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, limit);
    } catch {
      return [];
    }
  },
};
