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
    assert.match(read("ui/src/main.tsx"), new RegExp(marker));
  });

  it("submits internally without the follow-up-message channel", () => {
    const ui = read("ui/src/main.tsx");
    const server = read("server/src/server.ts");
    assert.match(ui, /callServerTool/);
    assert.match(ui, /updateModelContext/);
    assert.doesNotMatch(ui, /sendMessage/);
    assert.match(server, /submit_guided_answer/);
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
