import { supabase } from "../lib/supabase";
import { CertAttempt, CertResult, CertReview, CertStatus } from "./types";

// Custom RPCs aren't in the generated Database types, so we call through an
// untyped handle (same pattern as jobStore / userProgressService).
const rpc = (supabase as any).rpc.bind(supabase);

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(fn, args);
  if (error) throw new Error(error.message || `rpc ${fn} failed`);
  return data as T;
}

/**
 * Thin wrapper over the certification RPCs. Every method maps 1:1 to a
 * SECURITY DEFINER function — the server enforces eligibility, scoring, timing,
 * and answer-key secrecy.
 */
export const certApi = {
  status: () => call<CertStatus>("cert_status"),
  courseCompletion: () => call<number>("get_course_completion"),
  recordAd: () => call<CertStatus>("cert_record_ad"),
  startAttempt: () => call<CertAttempt>("cert_start_attempt"),
  saveAnswer: (attemptId: string, questionId: string, selected: string | null) =>
    call<boolean>("cert_save_answer", { p_attempt: attemptId, p_question: questionId, p_selected: selected }),
  submitAttempt: (attemptId: string) => call<CertResult>("cert_submit_attempt", { p_attempt: attemptId }),
  getActiveAttempt: () =>
    call<{ active: boolean; expired?: boolean; attempt?: CertAttempt; result?: CertResult }>("cert_get_active_attempt"),
  review: (attemptId: string) => call<CertReview>("cert_review", { p_attempt: attemptId }),
};
