import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Optional external test runner, not a runtime dependency of the plugin.
const { chromium } = await import(process.env.INTENT_FOUNDRY_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.INTENT_FOUNDRY_PLAYWRIGHT_MODULE).href : "playwright");
const temp = mkdtempSync(join(tmpdir(), "intent-foundry-browser-"));
const client = new Client({ name: "browser-recovery-test", version: "1" });
const transport = new StdioClientTransport({ command: process.execPath, args: ["mcp/server.cjs", "--stdio"],
  env: { ...process.env, TEMP: temp, TMP: temp, TMPDIR: temp } });
const html = readFileSync("mcp/assets/index.html");
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(req.url === "/app" ? html : '<!doctype html><html><body><iframe title="Question card" style="width:650px;height:850px;border:0"></iframe></body></html>');
});
let browser;
try {
  await client.connect(transport);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const sequence = await client.callTool({ name: "present_guided_sequence", arguments: {
    sessionId: "browser-recovery", questions: [1, 2].map((n) => ({ questionId: `q${n}`, question: `Pregunta ${n}`,
      kind: "multi", locale: "es", options: [{ id: "A", label: "Opción A" }, { id: "B", label: "Opción B" }] })),
  } });
  assert.equal(sequence.isError, undefined);
  browser = await chromium.launch({ headless: true, ...(process.env.INTENT_FOUNDRY_BROWSER_CHANNEL ? { channel: process.env.INTENT_FOUNDRY_BROWSER_CHANNEL } : {}) });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let loseSaveResponse = true;
  let loseFinalizeResponse = false;
  let saveCalls = 0;
  await page.exposeFunction("mcpCall", async (params) => {
    if (params.name === "save_guided_session_answer") {
      saveCalls++;
    }
    const result = await client.callTool(params);
    if (params.name === "save_guided_session_answer" && loseSaveResponse) {
      loseSaveResponse = false;
      throw new Error("Simulated response loss after server write");
    }
    if (params.name === "finalize_guided_session" && loseFinalizeResponse) {
      loseFinalizeResponse = false;
      throw new Error("Simulated finalize response loss");
    }
    return result;
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  // A minimal MCP Apps host. No window.openai/widgetState: exercise actual server recovery.
  await page.evaluate((initialResult) => {
    window.addEventListener("message", async (event) => {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== "2.0" || !msg.method) return;
      const reply = (result) => event.source.postMessage({ jsonrpc: "2.0", id: msg.id, result }, event.origin);
      if (msg.method === "ui/initialize") {
        reply({ protocolVersion: msg.params.protocolVersion, hostInfo: { name: "test-host", version: "1" }, hostCapabilities: { serverTools: {} }, hostContext: { theme: "light", locale: "es" } });
      } else if (msg.method === "ui/notifications/initialized") {
        event.source.postMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: initialResult }, event.origin);
      } else if (msg.method === "tools/call") {
        try { reply(await window.mcpCall(msg.params)); }
        catch (error) { event.source.postMessage({ jsonrpc: "2.0", id: msg.id, error: { code: -32603, message: error.message } }, event.origin); }
      } else if (msg.id !== undefined) reply({});
    });
    document.querySelector("iframe").src = "/app";
  }, sequence);
  const card = page.frameLocator("iframe");
  await card.getByRole("heading", { name: "Pregunta 1", exact: true }).waitFor();
  await card.locator(".option label").nth(0).click();
  await card.locator(".option label").nth(1).click();
  await card.getByRole("button", { name: "Siguiente", exact: true }).click();
  await card.getByRole("heading", { name: "Pregunta 2", exact: true }).waitFor();
  let state = await client.callTool({ name: "read_guided_session", arguments: { sessionId: "browser-recovery" } });
  assert.deepEqual(state.structuredContent.answers[0].selected, ["A", "B"]);
  assert.equal(saveCalls, 1); // No duplicate submission after a lost acknowledgment.
  await page.evaluate(() => { document.querySelector("iframe").src = "/app"; });
  await card.getByRole("heading", { name: "Pregunta 2", exact: true }).waitFor();
  await card.getByRole("button", { name: "Anterior", exact: true }).click();
  assert.equal(await card.locator('input:checked').count(), 2);
  await card.getByRole("button", { name: "Siguiente", exact: true }).click();
  await card.getByRole("heading", { name: "Pregunta 2", exact: true }).waitFor();
  await card.locator(".option label").nth(0).click();
  loseFinalizeResponse = true;
  await card.getByRole("button", { name: "Finalizar", exact: true }).click();
  await card.getByRole("heading", { name: "Sesión finalizada", exact: true }).waitFor();
  const replay = await client.callTool({ name: "present_guided_sequence", arguments: {
    sessionId: "browser-recovery", questions: sequence.structuredContent.questions,
  } });
  assert.equal(replay.isError, undefined);
  await page.evaluate(() => { document.querySelector("iframe").src = "/app"; });
  await card.getByRole("heading", { name: "Sesión finalizada", exact: true }).waitFor();
  assert.equal(await card.getByRole("checkbox").count(), 0);
  assert.equal(await card.getByRole("button", { name: "Anterior", exact: true }).isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log("Browser recovery passed: multi-select, lost save response, remount, previous answers, lost finalize response, finalized remount.");
} finally {
  await browser?.close();
  await client.close();
  await new Promise((resolve) => server.close(resolve));
  rmSync(temp, { recursive: true, force: true });
}
