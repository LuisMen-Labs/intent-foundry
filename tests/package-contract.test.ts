import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

describe("Skill and MCP integration contract", () => {
  it("requires the interactive tool and recognizes its answer envelope", () => {
    const skill = read("skills/guided-clarity/SKILL.md");
    const integration = read("skills/guided-clarity/references/mcp-integration.md");
    assert.match(skill, /present_guided_question/);
    assert.match(integration, /intent_foundry_answer_v1/);
    assert.match(integration, /Do not substitute Markdown choices/);
  });

  it("keeps package, plugin, server, and UI versions aligned", () => {
    const packageVersion = JSON.parse(read("package.json")).version;
    const pluginVersion = JSON.parse(read(".codex-plugin/plugin.json")).version;
    assert.equal(packageVersion, pluginVersion);
    assert.match(read("server/src/server.ts"), new RegExp(`VERSION = "${packageVersion.replaceAll(".", "\\.")}"`));
    assert.match(read("ui/src/main.tsx"), new RegExp(`version: "${packageVersion.replaceAll(".", "\\.")}"`));
  });

  it("uses the same answer envelope in the Skill and UI", () => {
    const marker = "intent_foundry_answer_v1";
    assert.match(read("skills/guided-clarity/references/mcp-integration.md"), new RegExp(marker));
    assert.match(read("server/src/server.ts"), new RegExp(marker));
  });

  it("submits internally without the follow-up-message channel", () => {
    const ui = read("ui/src/main.tsx");
    const server = read("server/src/server.ts");
    assert.match(ui, /callServerTool/);
    assert.doesNotMatch(ui, /updateModelContext/);
    assert.doesNotMatch(ui, /sendMessage/);
    assert.doesNotMatch(ui, /sendFollowUpMessage/);
    assert.match(server, /submit_guided_answer/);
    assert.match(server, /visibility: \["app"\]/);
  });

  it("has no redundant chat or model-context delivery stage", () => {
    const delivery = read("ui/src/delivery.ts");
    assert.match(delivery, /server-error/);
    assert.doesNotMatch(delivery, /context-pending/);
    assert.doesNotMatch(delivery, /updateContext/);
  });

  it("keeps the compact, progressive-disclosure response contract", () => {
    const shared = read("shared/question.ts");
    const ui = read("ui/src/main.tsx");
    const integration = read("skills/guided-clarity/references/mcp-integration.md");
    assert.match(shared, /allowSkip/);
    assert.match(shared, /skipped/);
    assert.match(ui, /Algo más/);
    assert.match(ui, /Omitir/);
    assert.match(integration, /progressive disclosure/);
  });

  it("supports navigable microsequences without chat messages", () => {
    const ui = read("ui/src/main.tsx");
    const server = read("server/src/server.ts");
    const integration = read("skills/guided-clarity/references/mcp-integration.md");
    assert.match(ui, /Anterior/);
    assert.match(ui, /Siguiente/);
    assert.match(ui, /Finalizar/);
    assert.match(server, /present_guided_sequence/);
    assert.match(server, /save_guided_session_answer/);
    assert.match(server, /read_guided_session/);
    assert.match(integration, /present_guided_sequence/);
    assert.doesNotMatch(ui, /updateModelContext/);
  });

  it("supports continuous checkpointed reviews with global progress", () => {
    const ui = read("ui/src/main.tsx");
    const server = read("server/src/server.ts");
    const integration = read("skills/guided-clarity/references/mcp-integration.md");
    assert.match(ui, /checkpoint_guided_session/);
    assert.match(ui, /Pregunta/);
    assert.match(ui, /Bloque/);
    assert.match(server, /checkpointQuestionIds/);
    assert.match(server, /Guided checkpoint is incomplete/);
    assert.match(integration, /ordered `checkpoints`/);
    assert.match(integration, /Question 11 of 23/);
  });

  it("ends with an honest user action when the host does not resume automatically", () => {
    const ui = read("ui/src/main.tsx");
    assert.match(ui, /Para verificarlas y continuar con el proceso/);
    assert.match(ui, /escribe «Verificar respuestas»/);
    assert.doesNotMatch(ui, /sendFollowUpMessage/);
    assert.doesNotMatch(ui, /ui\/message/);
  });

  it("persists only a bounded temporary queue across MCP processes", () => {
    const store = read("server/src/session-store.ts");
    const integration = read("skills/guided-clarity/references/mcp-integration.md");
    assert.match(store, /tmpdir\(\)/);
    assert.match(store, /createHash\("sha256"\)/);
    assert.match(store, /MAX_FILE_BYTES/);
    assert.match(integration, /20 validated sessions/);
    assert.match(integration, /24 hours/);
    assert.match(integration, /must never contain secrets/);
  });

  it("requires decision-shape classification, coaching quality, and explained caps", () => {
    const skill = read("skills/guided-clarity/SKILL.md");
    const design = read("skills/guided-clarity/references/question-design.md");
    const coaching = read("skills/guided-clarity/references/coaching-quality.md");
    assert.match(skill, /pairwise compatibility check/);
    assert.match(design, /selectionLimitReason/);
    assert.match(design, /omit `maxSelections` by default/);
    assert.match(coaching, /Require 6\/6/);
  });
});
