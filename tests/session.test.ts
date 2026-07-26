import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GuidedAnswer, GuidedQuestion } from "../shared/question";
import type { GuidedSession } from "../shared/session.ts";
import { upsertSessionAnswer, validateSession, validateSessionAnswer } from "../shared/session.ts";

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
});
