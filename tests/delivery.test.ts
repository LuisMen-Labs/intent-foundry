import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliverGuidedAnswer } from "../ui/src/delivery.ts";

describe("deliverGuidedAnswer", () => {
  it("reports a server failure without updating model context", async () => {
    let contextCalls = 0;
    const result = await deliverGuidedAnswer({
      submit: async () => ({ isError: true }),
      updateContext: async () => { contextCalls += 1; },
    }, false);

    assert.deepEqual(result, { status: "server-error", serverAccepted: false });
    assert.equal(contextCalls, 0);
  });

  it("preserves server acceptance when the context update fails", async () => {
    const result = await deliverGuidedAnswer({
      submit: async () => ({}),
      updateContext: async () => { throw new Error("transient host failure"); },
    }, false);

    assert.deepEqual(result, { status: "context-error", serverAccepted: true });
  });

  it("retries only model context after server acceptance", async () => {
    let submitCalls = 0;
    let contextCalls = 0;
    const result = await deliverGuidedAnswer({
      submit: async () => { submitCalls += 1; return {}; },
      updateContext: async () => { contextCalls += 1; },
    }, true);

    assert.deepEqual(result, { status: "sent", serverAccepted: true });
    assert.equal(submitCalls, 0);
    assert.equal(contextCalls, 1);
  });
});
