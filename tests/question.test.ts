import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GuidedAnswer, GuidedQuestion } from "../shared/question";
import { validateAnswer } from "../shared/question.ts";

const question: GuidedQuestion = {
  questionId: "R-013",
  question: "What should stop the system?",
  kind: "multi",
  options: [{ id: "A", label: "Daily loss" }, { id: "B", label: "Drawdown" }],
  otherAllowed: true,
  minSelections: 1,
  maxSelections: 2,
  locale: "en",
};

function answer(overrides: Partial<GuidedAnswer> = {}): GuidedAnswer {
  return { questionId: "R-013", kind: "multi", selected: ["A"], labels: ["Daily loss"], ...overrides };
}

describe("validateAnswer", () => {
  it("accepts a valid selection", () => assert.equal(validateAnswer(question, answer()), null));
  it("accepts Other as the only answer", () => assert.equal(validateAnswer(question, answer({ selected: [], labels: [], other: "My rule" })), null));
  it("counts Other against the maximum", () => assert.equal(validateAnswer(question, answer({ selected: ["A", "B"], other: "Third path" })), "too_many_selections"));
  it("rejects unknown and duplicate options", () => {
    assert.equal(validateAnswer(question, answer({ selected: ["Z"] })), "unknown_option");
    assert.equal(validateAnswer(question, answer({ selected: ["A", "A"] })), "duplicate_option");
  });
  it("requires every option in ranking mode", () => {
    const ranked = { ...question, kind: "rank" as const, otherAllowed: false, maxSelections: undefined };
    assert.equal(validateAnswer(ranked, { ...answer(), kind: "rank", selected: ["A"] }), "rank_all_options");
  });
});
