import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { GuidedAnswer, GuidedQuestion } from "../../shared/question";
import { validateAnswer, validateQuestion } from "../../shared/question";

const VERSION = "0.2.0-beta.6";
const RESOURCE_URI = "ui://intent-foundry/guided-question-v6.html";
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
  otherAllowed: z.boolean().optional(),
  allowSkip: z.boolean().optional(),
  minSelections: z.number().int().min(1).optional(),
  maxSelections: z.number().int().positive().optional(),
  selectionLimitReason: z.string().max(240).optional(),
  locale: z.enum(["es", "en"]).default("es"),
};

const answerSchema = z.object({
  questionId: z.string().min(1).max(80),
  kind: z.enum(["single", "multi", "rank"]),
  selected: z.array(z.string().min(1).max(24)).max(8),
  labels: z.array(z.string().max(120)).max(8),
  other: z.string().max(1000).optional(),
  skipped: z.boolean().optional(),
});

function createServer() {
  const server = new McpServer({ name: "intent-foundry", version: VERSION });

  registerAppTool(server, "present_guided_question", {
    title: "Present a guided question",
    description: "Always use this tool when Guided Clarity needs one answer. Use single only when one choice logically excludes all others, multi for compatible components, and rank for priority order. Never impose a restrictive multi-select maximum without a concrete selectionLimitReason. The compact card progressively reveals tradeoffs and supports an optional evidence-backed recommendation, progress, Other, and Skip. Ask exactly one question and do not repeat it in prose.",
    inputSchema: questionSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Preparing a guided question…",
      "openai/toolInvocation/invoked": "Question ready",
    },
  }, async (input) => {
    const question: GuidedQuestion = {
      ...input,
      otherAllowed: input.kind === "rank" ? false : (input.otherAllowed ?? true),
      allowSkip: input.allowSkip ?? true,
      minSelections: input.kind === "rank" ? input.options.length : (input.minSelections ?? 1),
      maxSelections: input.kind === "single" || input.kind === "rank" ? (input.kind === "rank" ? input.options.length : 1) : input.maxSelections,
    };
    const validationError = validateQuestion(question);
    if (validationError) {
      return { isError: true, content: [{ type: "text" as const, text: `Invalid guided question: ${validationError}` }] };
    }

    return {
      content: [{ type: "text" as const, text: headlessSummary(question) }],
      structuredContent: question as unknown as Record<string, unknown>,
    };
  });

  server.registerTool("submit_guided_answer", {
    title: "Submit a guided answer",
    description: "Validate and return an answer submitted inside the Intent Foundry card. This is an internal UI transport; do not call it to invent or infer a user's answer.",
    inputSchema: { question: z.object(questionSchema), answer: answerSchema },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { visibility: ["app"] },
      "openai/toolInvocation/invoking": "Saving answer…",
      "openai/toolInvocation/invoked": "Answer saved",
    },
  }, async ({ question, answer }) => {
    const validationError = validateAnswer(question as GuidedQuestion, answer as GuidedAnswer);
    if (validationError) {
      return { isError: true, content: [{ type: "text" as const, text: `Invalid guided answer: ${validationError}` }] };
    }
    const normalized = answer as GuidedAnswer;
    return {
      content: [{ type: "text" as const, text: `intent_foundry_answer_v1\n${JSON.stringify(normalized)}` }],
      structuredContent: { marker: "intent_foundry_answer_v1", answer: normalized },
    };
  });

  registerAppResource(server, "Intent Foundry guided question", RESOURCE_URI, {
    mimeType: RESOURCE_MIME_TYPE,
    description: "Compact accessible single-select, multi-select, and ranking interface with progressive disclosure.",
  }, async () => ({ contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml, _meta: { ui: { prefersBorder: false } } }] }));

  return server;
}

function headlessSummary(question: GuidedQuestion): string {
  const choices = question.options.map((option) => `${option.id}. ${option.label}`).join(" | ");
  return `Intent Foundry rendered question ${question.questionId}: ${question.question} Choices: ${choices}. Wait for the user's submitted answer; do not repeat the card or add operational details.`;
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
