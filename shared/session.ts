import type { GuidedAnswer, GuidedQuestion } from "./question.ts";
import { validateAnswer, validateQuestion } from "./question.ts";

const MAX_SESSION_BYTES = 128 * 1024;

export interface GuidedSession {
  marker: "intent_foundry_session_v1";
  sessionId: string;
  questions: GuidedQuestion[];
  checkpoints?: GuidedCheckpoint[];
}

export interface GuidedCheckpoint {
  checkpointId: string;
  throughQuestionId: string;
  label?: string;
}

export interface GuidedSessionSnapshot {
  marker: "intent_foundry_session_state_v1";
  sessionId: string;
  answers: GuidedAnswer[];
  finalized: boolean;
  completedCheckpoints: string[];
}

export function validateSession(session: GuidedSession): string | null {
  if (!session.sessionId.trim()) return "missing_session_id";
  if (session.questions.length < 1 || session.questions.length > 32) return "invalid_question_count";
  if (new TextEncoder().encode(JSON.stringify(session)).byteLength > MAX_SESSION_BYTES) return "session_too_large";
  const ids = session.questions.map((question) => question.questionId);
  if (new Set(ids).size !== ids.length) return "duplicate_question_id";
  for (const question of session.questions) {
    const error = validateQuestion(question);
    if (error) return `invalid_question:${question.questionId}:${error}`;
  }
  if (session.checkpoints) {
    if (session.checkpoints.length < 1 || session.checkpoints.length > 16) return "invalid_checkpoint_count";
    const checkpointIds = session.checkpoints.map((checkpoint) => checkpoint.checkpointId);
    if (new Set(checkpointIds).size !== checkpointIds.length) return "duplicate_checkpoint_id";
    let previousIndex = -1;
    for (const checkpoint of session.checkpoints) {
      if (!checkpoint.checkpointId.trim()) return "missing_checkpoint_id";
      const index = ids.indexOf(checkpoint.throughQuestionId);
      if (index < 0) return "checkpoint_question_not_in_session";
      if (index <= previousIndex) return "checkpoints_not_in_order";
      previousIndex = index;
    }
    if (previousIndex !== session.questions.length - 1) return "checkpoint_must_end_session";
  }
  return null;
}

export function checkpointQuestionIds(
  session: GuidedSession,
  checkpointId: string,
): string[] | null {
  const checkpoints = session.checkpoints ?? [];
  const checkpointIndex = checkpoints.findIndex((item) => item.checkpointId === checkpointId);
  if (checkpointIndex < 0) return null;
  const questionIds = session.questions.map((question) => question.questionId);
  const start = checkpointIndex === 0
    ? 0
    : questionIds.indexOf(checkpoints[checkpointIndex - 1].throughQuestionId) + 1;
  const end = questionIds.indexOf(checkpoints[checkpointIndex].throughQuestionId) + 1;
  return questionIds.slice(start, end);
}

export function validateSessionAnswer(
  session: GuidedSession,
  answer: GuidedAnswer,
): string | null {
  const sessionError = validateSession(session);
  if (sessionError) return sessionError;
  const question = session.questions.find((candidate) => candidate.questionId === answer.questionId);
  if (!question) return "question_not_in_session";
  return validateAnswer(question, answer);
}

export function upsertSessionAnswer(
  answers: GuidedAnswer[],
  answer: GuidedAnswer,
): GuidedAnswer[] {
  const index = answers.findIndex((candidate) => candidate.questionId === answer.questionId);
  if (index < 0) return [...answers, answer];
  const next = [...answers];
  next[index] = answer;
  return next;
}
