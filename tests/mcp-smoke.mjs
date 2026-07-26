import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "intent-foundry-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["mcp/server.cjs", "--stdio"],
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  assert(tools.tools.some((tool) => tool.name === "present_guided_question"));
  assert(tools.tools.some((tool) => tool.name === "present_guided_sequence"));
  assert(tools.tools.some((tool) => tool.name === "submit_guided_answer"));
  assert(tools.tools.some((tool) => tool.name === "read_guided_session"));

  const result = await client.callTool({
    name: "present_guided_question",
    arguments: {
      questionId: "smoke-1",
      question: "Which path should we test?",
      kind: "single",
      options: [
        { id: "A", label: "Safe path", recommended: true, downside: "May take longer" },
        { id: "B", label: "Fast path", downside: "Higher uncertainty" },
      ],
      recommendationReason: "It minimizes irreversible risk.",
      otherAllowed: true,
      minSelections: 1,
      maxSelections: 1,
      locale: "en",
    },
  });
  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent.questionId, "smoke-1");

  const invalid = await client.callTool({
    name: "present_guided_question",
    arguments: {
      questionId: "smoke-invalid",
      question: "Which path?",
      kind: "single",
      options: [
        { id: "A", label: "Safe path", recommended: true },
        { id: "B", label: "Fast path" },
      ],
      otherAllowed: true,
      minSelections: 1,
      maxSelections: 1,
      locale: "en",
    },
  });
  assert.equal(invalid.isError, true);

  const submitted = await client.callTool({
    name: "submit_guided_answer",
    arguments: {
      question: result.structuredContent,
      answer: { questionId: "smoke-1", kind: "single", selected: ["A"], labels: ["Safe path"] },
    },
  });
  assert.equal(submitted.isError, undefined);
  assert.equal(submitted.structuredContent.answer.selected[0], "A");

  const sequence = await client.callTool({
    name: "present_guided_sequence",
    arguments: {
      sessionId: "smoke-session",
      questions: [
        {
          questionId: "sequence-1",
          question: "Which first path?",
          kind: "single",
          options: [{ id: "A", label: "Alpha" }, { id: "B", label: "Beta" }],
          otherAllowed: true,
          minSelections: 1,
          maxSelections: 1,
          locale: "en",
        },
        {
          questionId: "sequence-2",
          question: "Which second path?",
          kind: "single",
          options: [{ id: "A", label: "Gamma" }, { id: "B", label: "Delta" }],
          otherAllowed: true,
          minSelections: 1,
          maxSelections: 1,
          locale: "en",
        },
      ],
      checkpoints: [
        { checkpointId: "block-1", throughQuestionId: "sequence-1" },
        { checkpointId: "block-2", throughQuestionId: "sequence-2" },
      ],
    },
  });
  assert.equal(sequence.isError, undefined);
  assert.equal(sequence.structuredContent.questions.length, 2);

  await client.callTool({
    name: "save_guided_session_answer",
    arguments: { sessionId: "smoke-session", answer: { questionId: "sequence-1", kind: "single", selected: ["A"], labels: ["Alpha"] } },
  });
  const checkpoint = await client.callTool({
    name: "checkpoint_guided_session",
    arguments: { sessionId: "smoke-session", checkpointId: "block-1" },
  });
  assert.equal(checkpoint.isError, undefined);
  assert.deepEqual(checkpoint.structuredContent.completedCheckpoints, ["block-1"]);
  const incompleteCheckpoint = await client.callTool({
    name: "checkpoint_guided_session",
    arguments: { sessionId: "smoke-session", checkpointId: "block-2" },
  });
  assert.equal(incompleteCheckpoint.isError, true);
  await client.callTool({
    name: "save_guided_session_answer",
    arguments: { sessionId: "smoke-session", answer: { questionId: "sequence-1", kind: "single", selected: ["B"], labels: ["Beta"] } },
  });
  const sessionState = await client.callTool({ name: "read_guided_session", arguments: { sessionId: "smoke-session" } });
  assert.equal(sessionState.structuredContent.answers.length, 1);
  assert.equal(sessionState.structuredContent.answers[0].selected[0], "B");

  const longQuestionCount = 23;
  const longBlockEnds = [4, 8, 12, 16, 20, 23];
  const longSequence = await client.callTool({
    name: "present_guided_sequence",
    arguments: {
      sessionId: "smoke-long-review-23",
      questions: Array.from({ length: longQuestionCount }, (_, index) => ({
        questionId: `review-${index + 1}`,
        question: `Review question ${index + 1}?`,
        kind: "single",
        options: [{ id: "A", label: "Alpha" }, { id: "B", label: "Beta" }],
        progress: { current: index + 1, total: longQuestionCount, label: "Review" },
        otherAllowed: true,
        minSelections: 1,
        maxSelections: 1,
        locale: "en",
      })),
      checkpoints: longBlockEnds.map((end, index) => ({
        checkpointId: `review-block-${index + 1}`,
        throughQuestionId: `review-${end}`,
      })),
    },
  });
  assert.equal(longSequence.isError, undefined);
  assert.equal(longSequence.structuredContent.questions.length, 23);
  for (let index = 1; index <= longQuestionCount; index += 1) {
    const saved = await client.callTool({
      name: "save_guided_session_answer",
      arguments: { sessionId: "smoke-long-review-23", answer: { questionId: `review-${index}`, kind: "single", selected: ["A"], labels: ["Alpha"] } },
    });
    assert.equal(saved.isError, undefined);
    const blockIndex = longBlockEnds.indexOf(index);
    if (blockIndex >= 0) {
      const savedCheckpoint = await client.callTool({
        name: "checkpoint_guided_session",
        arguments: { sessionId: "smoke-long-review-23", checkpointId: `review-block-${blockIndex + 1}` },
      });
      assert.equal(savedCheckpoint.isError, undefined);
    }
  }

  const restartedClient = new Client({ name: "intent-foundry-restart-smoke", version: "1.0.0" });
  const restartedTransport = new StdioClientTransport({
    command: process.execPath,
    args: ["mcp/server.cjs", "--stdio"],
  });
  await restartedClient.connect(restartedTransport);
  try {
    const resumed = await restartedClient.callTool({ name: "read_guided_session", arguments: { sessionId: "smoke-session" } });
    assert.equal(resumed.structuredContent.answers.length, 1);
    assert.equal(resumed.structuredContent.answers[0].selected[0], "B");
    const finalized = await restartedClient.callTool({ name: "finalize_guided_session", arguments: { sessionId: "smoke-session" } });
    assert.equal(finalized.structuredContent.finalized, true);
    const resumedLong = await restartedClient.callTool({ name: "read_guided_session", arguments: { sessionId: "smoke-long-review-23" } });
    assert.equal(resumedLong.structuredContent.answers.length, 23);
    assert.deepEqual(resumedLong.structuredContent.completedCheckpoints, longBlockEnds.map((_, index) => `review-block-${index + 1}`));
  } finally {
    await restartedClient.close();
  }

  const resource = await client.readResource({ uri: "ui://intent-foundry/guided-session-v10.html" });
  assert(resource.contents[0].text.includes("Intent Foundry"));
  process.stdout.write("MCP smoke test passed\n");
} finally {
  await client.close();
}
