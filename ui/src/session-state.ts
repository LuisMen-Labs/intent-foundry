import type { GuidedSession, GuidedSessionSnapshot } from "../../shared/session.ts";
import { validateSessionAnswer } from "../../shared/session.ts";

export type Draft = { selected: string[]; other: string; otherOpen: boolean };
export type PersistedState = {
  sessionId: string;
  currentIndex: number;
  drafts: Record<string, Draft>;
  savedIds: string[];
  finalized: boolean;
  completedCheckpoints: string[];
};

// Server state is authoritative. A host cache can disappear or outlive its server session.
export function restoreSession(session: GuidedSession, value: unknown, cache?: PersistedState): PersistedState {
  const state = value as GuidedSessionSnapshot | undefined;
  if (!state || state.marker !== "intent_foundry_session_state_v1" || state.sessionId !== session.sessionId
    || !Array.isArray(state.answers) || typeof state.finalized !== "boolean"
    || !Array.isArray(state.completedCheckpoints)) throw new Error("invalid_session_state");
  const seen = new Set<string>();
  for (const answer of state.answers) {
    if (validateSessionAnswer(session, answer) || seen.has(answer.questionId)) throw new Error("invalid_session_answer");
    seen.add(answer.questionId);
  }
  const checkpointIds = new Set((session.checkpoints ?? []).map((item) => item.checkpointId));
  if (state.completedCheckpoints.some((id) => !checkpointIds.has(id))) throw new Error("invalid_checkpoint_state");
  const drafts = Object.fromEntries(session.questions.map((question) => {
    const answer = state.answers.find((item) => item.questionId === question.questionId);
    const cached = cache?.sessionId === session.sessionId ? cache.drafts?.[question.questionId] : undefined;
    // Preserve an unfinished host draft only for an unanswered question. It is not a saved answer.
    if (!state.finalized && !answer && cached && Array.isArray(cached.selected)
      && cached.selected.every((id) => question.options.some((option) => option.id === id))
      && new Set(cached.selected).size === cached.selected.length
      && typeof cached.other === "string" && cached.other.length <= 1000 && typeof cached.otherOpen === "boolean"
      && (!cached.otherOpen || question.otherAllowed)
      && (question.maxSelections === undefined || cached.selected.length + Number(cached.otherOpen) <= question.maxSelections)) {
      return [question.questionId, cached];
    }
    return [question.questionId, {
      selected: answer?.skipped ? [] : answer?.selected ?? (question.kind === "rank" ? question.options.map((item) => item.id) : []),
      other: answer?.other ?? "",
      otherOpen: Boolean(answer?.other),
    }];
  }));
  const firstUnanswered = session.questions.findIndex((question) => !seen.has(question.questionId));
  return {
    sessionId: session.sessionId, drafts, savedIds: [...seen], finalized: state.finalized,
    currentIndex: state.finalized || firstUnanswered < 0 ? session.questions.length : firstUnanswered,
    completedCheckpoints: state.completedCheckpoints,
  };
}
