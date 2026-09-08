import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { restoreSession } from "../ui/src/session-state.ts";
import { deliverGuidedAnswer } from "../ui/src/delivery.ts";
import type { GuidedSession, GuidedSessionSnapshot } from "../shared/session.ts";

const session: GuidedSession = {
  marker: "intent_foundry_session_v1", sessionId: "recovery-test",
  questions: [1, 2, 3].map((n) => ({
    questionId: `q${n}`, question: `Question ${n}?`, kind: "multi",
    options: [{ id: "A", label: "Alpha" }, { id: "B", label: "Beta" }],
    otherAllowed: true, allowSkip: true, minSelections: 1, locale: "en",
  })),
};
const snapshot: GuidedSessionSnapshot = {
  marker: "intent_foundry_session_state_v1", sessionId: session.sessionId,
  answers: [{ questionId: "q1", kind: "multi", selected: ["A", "B"], labels: ["Alpha", "Beta"], other: "My words" }],
  finalized: false, completedCheckpoints: [],
};

describe("session recovery", () => {
  it("restores answers and resumes at the first unanswered question without a host cache", () => {
    const restored = restoreSession(session, snapshot);
    assert.equal(restored.currentIndex, 1);
    assert.deepEqual(restored.drafts.q1, { selected: ["A", "B"], other: "My words", otherOpen: true });
    assert.deepEqual(restored.savedIds, ["q1"]);
  });
  it("does not re-ask questions when the server session is finalized", () => {
    const restored = restoreSession(session, { ...snapshot, finalized: true });
    assert.equal(restored.finalized, true);
    assert.equal(restored.currentIndex, 3);
    assert.equal(restored.savedIds.length, 1); // No invented answers for partial completion.
  });
  it("restores completion when every question was saved but Finish was not clicked", () => {
    const answers = session.questions.map((q) => ({ ...snapshot.answers[0], questionId: q.questionId }));
    const restored = restoreSession(session, { ...snapshot, answers });
    assert.equal(restored.currentIndex, 3);
    assert.equal(restored.finalized, false);
  });
  it("restores skipped questions without treating them as selections", () => {
    const restored = restoreSession(session, { ...snapshot, answers: [{ questionId: "q1", kind: "multi", selected: [], labels: [], skipped: true }] });
    assert.deepEqual(restored.drafts.q1.selected, []);
    assert.equal(restored.currentIndex, 1);
  });
  it("preserves an unfinished host draft without claiming it was saved", () => {
    const cache = restoreSession(session, snapshot);
    cache.drafts.q2 = { selected: ["B"], other: "Draft", otherOpen: true };
    const restored = restoreSession(session, snapshot, cache);
    assert.deepEqual(restored.drafts.q2, cache.drafts.q2);
    assert.deepEqual(restored.savedIds, ["q1"]);
    assert.deepEqual(restoreSession(session, { ...snapshot, finalized: true }, cache).drafts.q2.selected, []);
  });
  it("rejects foreign, malformed, duplicate and stale answers", () => {
    for (const value of [null, { ...snapshot, sessionId: "another" },
      { ...snapshot, answers: [...snapshot.answers, ...snapshot.answers] },
      { ...snapshot, answers: [{ ...snapshot.answers[0], selected: ["unknown"] }] },
      { ...snapshot, completedCheckpoints: ["unknown"] }]) {
      assert.throws(() => restoreSession(session, value));
    }
  });
  it("recovers when the server saved the answer but the transport lost the acknowledgment", async () => {
    const result = await deliverGuidedAnswer({ submit: async () => { throw new Error("response lost"); }, reconcile: async () => true });
    assert.deepEqual(result, { status: "sent", serverAccepted: true });
  });
  it("does not claim success when recovery also fails", async () => {
    const result = await deliverGuidedAnswer({ submit: async () => ({ isError: true }), reconcile: async () => { throw new Error("offline"); } });
    assert.deepEqual(result, { status: "server-error", serverAccepted: false });
  });
});
