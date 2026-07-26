import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import type { GuidedAnswer, GuidedQuestion } from "../shared/question";
import type { GuidedSession } from "../shared/session.ts";
import { FileSessionStore } from "../server/src/session-store.ts";

const testRoot = mkdtempSync(join(tmpdir(), "intent-foundry-session-test-"));
after(() => rmSync(testRoot, { recursive: true, force: true }));

const question: GuidedQuestion = {
  questionId: "Q-1",
  question: "Which path?",
  kind: "single",
  options: [{ id: "A", label: "Alpha" }, { id: "B", label: "Beta" }],
  otherAllowed: true,
  allowSkip: true,
  minSelections: 1,
  maxSelections: 1,
  locale: "en",
};

const session: GuidedSession = {
  marker: "intent_foundry_session_v1",
  sessionId: "cross-process-session",
  questions: [question],
};

const answer: GuidedAnswer = {
  questionId: "Q-1",
  kind: "single",
  selected: ["A"],
  labels: ["Alpha"],
};

describe("file session store", () => {
  it("restores a validated session from a new store instance", () => {
    new FileSessionStore(testRoot).put({ session, answers: [answer], finalized: true });

    const restored = new FileSessionStore(testRoot).get(session.sessionId);
    assert.equal(restored?.finalized, true);
    assert.deepEqual(restored?.answers, [answer]);
    assert.deepEqual(restored?.session.questions, [question]);
  });

  it("expires stale session state", () => {
    let now = 1_000;
    const expiringRoot = join(testRoot, "expiring");
    const writer = new FileSessionStore(expiringRoot, 20, 100, () => now);
    writer.put({ session: { ...session, sessionId: "expires" }, answers: [], finalized: false });
    now = 1_101;

    assert.equal(new FileSessionStore(expiringRoot, 20, 100, () => now).get("expires"), null);
  });
});
