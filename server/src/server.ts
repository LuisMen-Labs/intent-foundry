import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { GuidedAnswer, GuidedQuestion } from "../../shared/question";
import { validateAnswer, validateQuestion } from "../../shared/question";
import type { GuidedSession, GuidedSessionSnapshot } from "../../shared/session";
import { checkpointQuestionIds, upsertSessionAnswer, validateSession, validateSessionAnswer } from "../../shared/session";
import { FileSessionStore, type StoredSession } from "./session-store";

const VERSION = "0.2.0-beta.9";
const RESOURCE_URI = "ui://intent-foundry/guided-session-v9.html";
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

const rawQuestionSchema = z.object(questionSchema);
const guidedSessionSchema = {
  sessionId: z.string().min(1).max(80),
  questions: z.array(rawQuestionSchema).min(1).max(32),
  checkpoints: z.array(z.object({
    checkpointId: z.string().min(1).max(80),
    throughQuestionId: z.string().min(1).max(80),
    label: z.string().max(80).optional(),
  })).min(1).max(16).optional(),
};

type RawQuestion = z.infer<typeof rawQuestionSchema>;
function normalizeQuestion(input: RawQuestion): GuidedQuestion {
  return {
    ...input,
    otherAllowed: input.kind === "rank" ? false : (input.otherAllowed ?? true),
    allowSkip: input.allowSkip ?? true,
    minSelections: input.kind === "rank" ? input.options.length : (input.minSelections ?? 1),
    maxSelections: input.kind === "single" || input.kind === "rank" ? (input.kind === "rank" ? input.options.length : 1) : input.maxSelections,
  };
}

function snapshot(stored: StoredSession): GuidedSessionSnapshot {
  return {
    marker: "intent_foundry_session_state_v1",
    sessionId: stored.session.sessionId,
    answers: stored.answers,
    finalized: stored.finalized,
    completedCheckpoints: stored.completedCheckpoints,
  };
}

function createServer() {
  const server = new McpServer({ name: "intent-foundry", version: VERSION });
  const sessions = new FileSessionStore();

  const rememberSession = (session: GuidedSession) => {
    const prior = sessions.get(session.sessionId);
    const questionIds = new Set(session.questions.map((question) => question.questionId));
    sessions.put({
      session,
      answers: (prior?.answers ?? []).filter((answer) => questionIds.has(answer.questionId)),
      finalized: false,
      completedCheckpoints: (prior?.completedCheckpoints ?? []).filter((checkpointId) =>
        session.checkpoints?.some((checkpoint) => checkpoint.checkpointId === checkpointId)),
    });
  };

  registerAppTool(server, "present_guided_question", {
    title: "Present a guided question",
    description: "Always use this tool when Guided Clarity needs one answer. Use single only when one choice logically excludes all others, multi for compatible components, and rank for priority order. Never impose a restrictive multi-select maximum without a concrete selectionLimitReason. The compact card progressively reveals tradeoffs and supports an optional evidence-backed recommendation, progress, Other, and Skip. Ask exactly one question and do not repeat it in prose.",
    inputSchema: questionSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Preparing a guided question…",
      "openai/toolInvocation/invoked": "Question ready",
    },
  }, async (input) => {
    const question = normalizeQuestion(input);
    const validationError = validateQuestion(question);
    if (validationError) {
      return { isError: true, content: [{ type: "text" as const, text: `Invalid guided question: ${validationError}` }] };
    }

    return {
      content: [{ type: "text" as const, text: headlessSummary(question) }],
      structuredContent: question as unknown as Record<string, unknown>,
    };
  });

  registerAppTool(server, "present_guided_sequence", {
    title: "Present a guided question sequence",
    description: "Present a navigable sequence when every queued question remains valid regardless of earlier selections. For a longer predetermined review, include ordered checkpoints so the card validates and saves each block before advancing while showing global question and block progress. Use a new sequence after a material branch. Do not hide dependent branches inside a fixed questionnaire.",
    inputSchema: guidedSessionSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { resourceUri: RESOURCE_URI },
      "openai/toolInvocation/invoking": "Preparing a guided sequence…",
      "openai/toolInvocation/invoked": "Sequence ready",
    },
  }, async ({ sessionId, questions: rawQuestions, checkpoints }) => {
    const session: GuidedSession = {
      marker: "intent_foundry_session_v1",
      sessionId,
      questions: rawQuestions.map(normalizeQuestion),
      ...(checkpoints ? { checkpoints } : {}),
    };
    const validationError = validateSession(session);
    if (validationError) {
      return { isError: true, content: [{ type: "text" as const, text: `Invalid guided session: ${validationError}` }] };
    }
    rememberSession(session);
    return {
      content: [{ type: "text" as const, text: headlessSessionSummary(session) }],
      structuredContent: session as unknown as Record<string, unknown>,
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

  server.registerTool("save_guided_session_answer", {
    title: "Save a guided session answer",
    description: "Validate and upsert one answer inside an active Intent Foundry sequence. Internal UI transport only.",
    inputSchema: { sessionId: z.string().min(1).max(80), answer: answerSchema },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { visibility: ["app"] },
      "openai/toolInvocation/invoking": "Saving answer…",
      "openai/toolInvocation/invoked": "Answer saved",
    },
  }, async ({ sessionId, answer }) => {
    const stored = sessions.get(sessionId);
    if (!stored) return { isError: true, content: [{ type: "text" as const, text: "Unknown or expired guided session" }] };
    if (stored.finalized) return { isError: true, content: [{ type: "text" as const, text: "Guided session is finalized" }] };
    const normalized = answer as GuidedAnswer;
    const validationError = validateSessionAnswer(stored.session, normalized);
    if (validationError) {
      return { isError: true, content: [{ type: "text" as const, text: `Invalid guided session answer: ${validationError}` }] };
    }
    stored.answers = upsertSessionAnswer(stored.answers, normalized);
    sessions.put(stored);
    const state = snapshot(stored);
    return {
      content: [{ type: "text" as const, text: `intent_foundry_session_state_v1\n${JSON.stringify(state)}` }],
      structuredContent: state as unknown as Record<string, unknown>,
    };
  });

  server.registerTool("finalize_guided_session", {
    title: "Finalize a guided session",
    description: "Finalize an active Intent Foundry sequence without inventing answers for unfinished questions. Internal UI transport only.",
    inputSchema: { sessionId: z.string().min(1).max(80) },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { visibility: ["app"] },
      "openai/toolInvocation/invoking": "Finalizing sequence…",
      "openai/toolInvocation/invoked": "Sequence finalized",
    },
  }, async ({ sessionId }) => {
    const stored = sessions.get(sessionId);
    if (!stored) return { isError: true, content: [{ type: "text" as const, text: "Unknown or expired guided session" }] };
    stored.finalized = true;
    sessions.put(stored);
    const state = snapshot(stored);
    return {
      content: [{ type: "text" as const, text: `intent_foundry_session_state_v1\n${JSON.stringify(state)}` }],
      structuredContent: state as unknown as Record<string, unknown>,
    };
  });

  server.registerTool("checkpoint_guided_session", {
    title: "Checkpoint a guided session block",
    description: "Verify that every question in the requested block has a stored answer before allowing the Intent Foundry card to advance. Internal UI transport only.",
    inputSchema: { sessionId: z.string().min(1).max(80), checkpointId: z.string().min(1).max(80) },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: {
      ui: { visibility: ["app"] },
      "openai/toolInvocation/invoking": "Saving checkpoint…",
      "openai/toolInvocation/invoked": "Checkpoint saved",
    },
  }, async ({ sessionId, checkpointId }) => {
    const stored = sessions.get(sessionId);
    if (!stored) return { isError: true, content: [{ type: "text" as const, text: "Unknown or expired guided session" }] };
    if (stored.finalized) return { isError: true, content: [{ type: "text" as const, text: "Guided session is finalized" }] };
    const requiredIds = checkpointQuestionIds(stored.session, checkpointId);
    if (!requiredIds) return { isError: true, content: [{ type: "text" as const, text: "Unknown guided checkpoint" }] };
    const answeredIds = new Set(stored.answers.map((answer) => answer.questionId));
    if (!requiredIds.every((questionId) => answeredIds.has(questionId))) {
      return { isError: true, content: [{ type: "text" as const, text: "Guided checkpoint is incomplete" }] };
    }
    stored.completedCheckpoints = Array.from(new Set([...stored.completedCheckpoints, checkpointId]));
    sessions.put(stored);
    const state = snapshot(stored);
    return {
      content: [{ type: "text" as const, text: `intent_foundry_session_state_v1\n${JSON.stringify(state)}` }],
      structuredContent: state as unknown as Record<string, unknown>,
    };
  });

  server.registerTool("read_guided_session", {
    title: "Read a guided session",
    description: "Read the validated latest answers from an Intent Foundry sequence so the agent can persist them and prepare the next adaptive block. Never infer unanswered questions.",
    inputSchema: { sessionId: z.string().min(1).max(80) },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ sessionId }) => {
    const stored = sessions.get(sessionId);
    if (!stored) return { isError: true, content: [{ type: "text" as const, text: "Unknown or expired guided session" }] };
    const state = snapshot(stored);
    return {
      content: [{ type: "text" as const, text: `intent_foundry_session_state_v1\n${JSON.stringify(state)}` }],
      structuredContent: { ...state, questions: stored.session.questions } as unknown as Record<string, unknown>,
    };
  });

  registerAppResource(server, "Intent Foundry guided question", RESOURCE_URI, {
    mimeType: RESOURCE_MIME_TYPE,
    description: "Compact accessible guided-question and navigable microsequence interface with progressive disclosure.",
  }, async () => ({ contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml, _meta: { ui: { prefersBorder: false } } }] }));

  return server;
}

function headlessSessionSummary(session: GuidedSession): string {
  const ids = session.questions.map((question) => question.questionId).join(", ");
  return `Intent Foundry rendered guided sequence ${session.sessionId} with questions ${ids}. In a graphical host, wait for navigation and finalization. In a headless host, present one compact letter-based fallback question at a time.`;
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
