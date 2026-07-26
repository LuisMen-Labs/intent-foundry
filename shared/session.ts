import type { GuidedAnswer, GuidedQuestion } from "./question.ts";
import { validateAnswer, validateQuestion } from "./question.ts";

export interface GuidedSession {
  marker: "intent_foundry_session_v1";
  sessionId: string;
  questions: GuidedQuestion[];
}

export interface GuidedSessionSnapshot {
  marker: "intent_foundry_session_state_v1";
  sessionId: string;
  answers: GuidedAnswer[];
  finalized: boolean;
}

export function validateSession(session: GuidedSession): string | null {
  if (!session.sessionId.trim()) return "missing_session_id";
  if (session.questions.length < 1 || session.questions.length > 8) return "invalid_question_count";
  const ids = session.questions.map((question) => question.questionId);
  if (new Set(ids).size !== ids.length) return "duplicate_question_id";
  for (const question of session.questions) {
    const error = validateQuestion(question);
    if (error) return `invalid_question:${question.questionId}:${error}`;
  }
  return null;
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
