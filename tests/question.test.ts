import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GuidedAnswer, GuidedQuestion } from "../shared/question";
import { validateAnswer, validateQuestion } from "../shared/question.ts";

const question: GuidedQuestion = {
  questionId: "R-013",
  question: "What should stop the system?",
  kind: "multi",
  options: [{ id: "A", label: "Daily loss" }, { id: "B", label: "Drawdown" }],
  otherAllowed: true,
  minSelections: 1,
  maxSelections: 2,
  selectionLimitReason: "Only two controls can be operated at once",
  locale: "en",
};

function answer(overrides: Partial<GuidedAnswer> = {}): GuidedAnswer {
  return { questionId: "R-013", kind: "multi", selected: ["A"], labels: ["Daily loss"], ...overrides };
}

describe("validateAnswer", () => {
  it("accepts a valid selection", () => assert.equal(validateAnswer(question, answer()), null));
  it("accepts Other as the only answer", () => assert.equal(validateAnswer(question, answer({ selected: [], labels: [], other: "My rule" })), null));
  it("counts Other against the maximum", () => assert.equal(validateAnswer(question, answer({ selected: ["A", "B"], labels: ["Daily loss", "Drawdown"], other: "Third path" })), "too_many_selections"));
  it("rejects unknown and duplicate options", () => {
    assert.equal(validateAnswer(question, answer({ selected: ["Z"] })), "unknown_option");
    assert.equal(validateAnswer(question, answer({ selected: ["A", "A"] })), "duplicate_option");
  });
  it("rejects inconsistent display labels and oversized Other text", () => {
    assert.equal(validateAnswer(question, answer({ labels: [] })), "labels_mismatch");
    assert.equal(validateAnswer(question, answer({ other: "x".repeat(1001) })), "other_too_long");
  });
  it("requires every option in ranking mode", () => {
    const ranked = { ...question, kind: "rank" as const, otherAllowed: false, minSelections: 2, maxSelections: 2 };
    assert.equal(validateAnswer(ranked, { ...answer(), kind: "rank", selected: ["A"] }), "rank_all_options");
  });
  it("accepts an explicit skip only when the question permits it", () => {
    const skipped = answer({ selected: [], labels: [], skipped: true });
    assert.equal(validateAnswer({ ...question, allowSkip: true }, skipped), null);
    assert.equal(validateAnswer(question, skipped), "skip_not_allowed");
  });
  it("rejects a skip mixed with an answer", () => {
    assert.equal(validateAnswer({ ...question, allowSkip: true }, answer({ skipped: true })), "skip_must_be_empty");
  });
});

describe("validateQuestion", () => {
  it("requires a reason and downside for a recommendation", () => {
    const recommended = { ...question, options: [{ id: "A", label: "Daily loss", recommended: true }, question.options[1]] };
    assert.equal(validateQuestion(recommended), "recommendation_reason_required");
    assert.equal(validateQuestion({ ...recommended, recommendationReason: "Protect capital" }), "recommendation_downside_required");
  });

  it("accepts a fully explained recommendation", () => {
    const recommended = {
      ...question,
      options: [{ id: "A", label: "Daily loss", recommended: true, downside: "May stop early" }, question.options[1]],
      recommendationReason: "Protect capital",
    };
    assert.equal(validateQuestion(recommended), null);
  });

  it("requires explicit all-option bounds for ranking", () => {
    assert.equal(validateQuestion({ ...question, kind: "rank", otherAllowed: false }), "rank_requires_all");
  });

  it("rejects an unexplained restrictive multi-select maximum", () => {
    assert.equal(validateQuestion({ ...question, selectionLimitReason: undefined }), "selection_limit_reason_required");
  });

  it("allows every compatible component when no arbitrary maximum is set", () => {
    assert.equal(validateQuestion({ ...question, maxSelections: undefined, selectionLimitReason: undefined }), null);
  });

  it("accepts all five compatible components when the question has no cap", () => {
    const options = ["A", "B", "C", "D", "E"].map((id) => ({ id, label: `Component ${id}` }));
    const fivePartQuestion = { ...question, questionId: "R-014-v3", options, maxSelections: undefined, selectionLimitReason: undefined };
    const fivePartAnswer = { questionId: "R-014-v3", kind: "multi" as const, selected: options.map(({ id }) => id), labels: options.map(({ label }) => label) };
    assert.equal(validateQuestion(fivePartQuestion), null);
    assert.equal(validateAnswer(fivePartQuestion, fivePartAnswer), null);
  });
});
