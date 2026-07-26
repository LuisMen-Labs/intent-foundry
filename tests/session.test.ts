import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GuidedAnswer, GuidedQuestion } from "../shared/question";
import type { GuidedSession } from "../shared/session.ts";
import { checkpointQuestionIds, upsertSessionAnswer, validateSession, validateSessionAnswer } from "../shared/session.ts";

const question = (questionId: string): GuidedQuestion => ({
  questionId,
  question: `Question ${questionId}`,
  kind: "single",
  options: [{ id: "A", label: "Alpha" }, { id: "B", label: "Beta" }],
  otherAllowed: true,
  allowSkip: true,
  minSelections: 1,
  maxSelections: 1,
  locale: "en",
});

const session = (questions = [question("Q-1"), question("Q-2")]): GuidedSession => ({
  marker: "intent_foundry_session_v1",
  sessionId: "S-1",
  questions,
});

const answer = (questionId: string, selected = "A"): GuidedAnswer => ({
  questionId,
  kind: "single",
  selected: [selected],
  labels: [selected === "A" ? "Alpha" : "Beta"],
});

describe("guided session", () => {
  it("accepts a short queue with unique valid questions", () => {
    assert.equal(validateSession(session()), null);
  });

  it("rejects duplicate question ids", () => {
    assert.equal(validateSession(session([question("Q-1"), question("Q-1")])), "duplicate_question_id");
  });

  it("rejects an answer that does not belong to the queue", () => {
    assert.equal(validateSessionAnswer(session(), answer("Q-3")), "question_not_in_session");
  });

  it("replaces a revised answer instead of duplicating it", () => {
    const revised = upsertSessionAnswer([answer("Q-1")], answer("Q-1", "B"));
    assert.equal(revised.length, 1);
    assert.deepEqual(revised[0].selected, ["B"]);
  });

  it("accepts a long review split into ordered checkpoints", () => {
    const questions = Array.from({ length: 23 }, (_, index) => question(`Q-${index + 1}`));
    const review: GuidedSession = {
      marker: "intent_foundry_session_v1",
      sessionId: "review-23",
      questions,
      checkpoints: [
        { checkpointId: "B-1", throughQuestionId: "Q-4" },
        { checkpointId: "B-2", throughQuestionId: "Q-8" },
        { checkpointId: "B-3", throughQuestionId: "Q-12" },
        { checkpointId: "B-4", throughQuestionId: "Q-16" },
        { checkpointId: "B-5", throughQuestionId: "Q-20" },
        { checkpointId: "B-6", throughQuestionId: "Q-23" },
      ],
    };
    assert.equal(validateSession(review), null);
    assert.deepEqual(checkpointQuestionIds(review, "B-2"), ["Q-5", "Q-6", "Q-7", "Q-8"]);
  });

  it("rejects checkpoints that do not end at the final question", () => {
    const invalid: GuidedSession = {
      ...session(),
      checkpoints: [{ checkpointId: "B-1", throughQuestionId: "Q-1" }],
    };
    assert.equal(validateSession(invalid), "checkpoint_must_end_session");
  });

  it("rejects oversized long-review payloads before persistence", () => {
    const oversized: GuidedSession = {
      marker: "intent_foundry_session_v1",
      sessionId: "oversized",
      questions: Array.from({ length: 32 }, (_, index) => ({
        ...question(`Q-${index + 1}`),
        question: "Q".repeat(500),
        options: Array.from({ length: 8 }, (__, optionIndex) => ({
          id: String(optionIndex),
          label: "L".repeat(120),
          description: "D".repeat(300),
          downside: "R".repeat(240),
        })),
      })),
    };
    assert.equal(validateSession(oversized), "session_too_large");
  });
});
