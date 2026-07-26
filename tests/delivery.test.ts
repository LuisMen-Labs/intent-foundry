import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliverGuidedAnswer } from "../ui/src/delivery.ts";

describe("deliverGuidedAnswer", () => {
  it("reports a server failure", async () => {
    const result = await deliverGuidedAnswer({
      submit: async () => ({ isError: true }),
    });

    assert.deepEqual(result, { status: "server-error", serverAccepted: false });
  });

  it("returns sent after the MCP server accepts the answer", async () => {
    let submitCalls = 0;
    const result = await deliverGuidedAnswer({
      submit: async () => { submitCalls += 1; return {}; },
    });

    assert.deepEqual(result, { status: "sent", serverAccepted: true });
    assert.equal(submitCalls, 1);
  });

  it("reports a thrown transport failure", async () => {
    const result = await deliverGuidedAnswer({
      submit: async () => { throw new Error("transport failure"); },
    });

    assert.deepEqual(result, { status: "server-error", serverAccepted: false });
  });
});
