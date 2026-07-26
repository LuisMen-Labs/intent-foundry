import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const VERSION = "0.2.0-beta.1";
const RESOURCE_URI = "ui://intent-foundry/guided-question-v1.html";
const root = resolve(__dirname, "..");
const widgetHtml = readFileSync(resolve(root, "mcp/assets/index.html"), "utf8");

const optionSchema = z.object({
  id: z.string().min(1).max(24),
  label: z.string().min(1).max(120),
  description: z.string().max(300).optional(),
  downside: z.string().max(240).optional(),
  recommended: z.boolean().optional(),
});

const questionSchema = {
  questionId: z.string().min(1).max(80),
  question: z.string().min(1).max(500),
  kind: z.enum(["single", "multi", "rank"]),
  options: z.array(optionSchema).min(2).max(8),
  why: z.string().max(500).optional(),
  progress: z.object({ current: z.number().int().positive(), total: z.number().int().positive().optional(), label: z.string().max(80).optional() }).optional(),
  recommendationReason: z.string().max(400).optional(),
  otherAllowed: z.boolean().default(true),
  minSelections: z.number().int().min(1).default(1),
  maxSelections: z.number().int().positive().optional(),
  locale: z.enum(["es", "en"]).default("es"),
};

function createServer() {
  const server = new McpServer({ name: "intent-foundry", version: VERSION });

  registerAppTool(server, "present_guided_question", {
    title: "Present a guided question",
    description: "Render one high-value question as an accessible interactive card. Use for Guided Clarity interviews and decisions requiring single choice, multiple selection, ranking, a recommendation with tradeoffs, or a free-form Other answer. Ask only one question per call.",
    inputSchema: questionSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: { ui: { resourceUri: RESOURCE_URI } },
  }, async (input) => {
    const recommendedCount = input.options.filter((option) => option.recommended).length;
    if (recommendedCount > 1) {
      return { isError: true, content: [{ type: "text" as const, text: "Only one option may be marked as recommended." }] };
    }
    if (new Set(input.options.map((option) => option.id)).size !== input.options.length) {
      return { isError: true, content: [{ type: "text" as const, text: "Option IDs must be unique." }] };
    }
    if (input.maxSelections !== undefined && input.maxSelections < input.minSelections) {
      return { isError: true, content: [{ type: "text" as const, text: "maxSelections must be greater than or equal to minSelections." }] };
    }
    const availableChoices = input.options.length + (input.otherAllowed && input.kind !== "rank" ? 1 : 0);
    if (input.minSelections > availableChoices || (input.maxSelections !== undefined && input.maxSelections > availableChoices)) {
      return { isError: true, content: [{ type: "text" as const, text: "Selection limits exceed the available choices." }] };
    }
    if (input.progress?.total !== undefined && input.progress.current > input.progress.total) {
      return { isError: true, content: [{ type: "text" as const, text: "Progress current cannot exceed progress total." }] };
    }
    if (input.recommendationReason && recommendedCount !== 1) {
      return { isError: true, content: [{ type: "text" as const, text: "A recommendation reason requires exactly one recommended option." }] };
    }
    if (input.kind === "single" && (input.minSelections !== 1 || (input.maxSelections !== undefined && input.maxSelections !== 1))) {
      return { isError: true, content: [{ type: "text" as const, text: "Single-choice questions require exactly one selection." }] };
    }

    return {
      content: [{ type: "text" as const, text: "An interactive Intent Foundry question is displayed. Do not repeat the options or add operational details; wait for the user's submitted answer." }],
      structuredContent: input,
    };
  });

  registerAppResource(server, "Intent Foundry guided question", RESOURCE_URI, {
    mimeType: RESOURCE_MIME_TYPE,
    description: "Accessible single-select, multi-select, and ranking question interface.",
  }, async () => ({ contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml }] }));

  return server;
}

async function main() {
  if (!process.argv.includes("--stdio")) throw new Error("Intent Foundry currently supports --stdio transport.");
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
