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

  const resource = await client.readResource({ uri: "ui://intent-foundry/guided-question-v2.html" });
  assert(resource.contents[0].text.includes("Intent Foundry"));
  process.stdout.write("MCP smoke test passed\n");
} finally {
  await client.close();
}
