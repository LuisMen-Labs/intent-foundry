# Security audit — 0.2.0-beta.4

Date: 2026-07-26

## Scope

Delta from beta.3: compact question layout, progressive disclosure, explicit `allowSkip`/`skipped` contract, internal `submit_guided_answer` transport, localized `Something else` and `Skip`, UI/server version and resource URI.

## Runtime findings

- Transport remains local stdio; no HTTP listener was added.
- No filesystem writes, credential access, dynamic evaluation, shell execution, telemetry, or new network calls were added.
- Skip is accepted only when the question explicitly permits it and only with empty selections, labels, and free text.
- A skipped question remains Unknown in the Skill contract; it is not interpreted as acceptance, rejection, or downstream authorization.
- Descriptions and downsides remain React text and are revealed only after selection; rationale remains in a native details element.
- Existing validation for question identity, kind, option IDs, uniqueness, bounds, `Other`, and length remains in force.
- `submit_guided_answer` validates the complete question/answer pair before returning the versioned envelope. The UI then updates model-visible context without sending a follow-up chat message.

## Verification

- TypeScript and tests: 20/20 pass.
- Exact regression: compatible multi-select choices remain selectable without an invented cap.
- Skip allowed, disallowed, and mixed-payload paths: pass.
- UI single-file build: pass.
- MCP smoke list/call/resource: pass.
- Browser DOM and visual inspection: compact first scan, progressive disclosure after selection, three simultaneous choices, and enabled submit passed.

## Built artifact hashes

- `mcp/server.cjs`: `a553e13cf39f6825c7af74ac332ea87d5c002508794bf871d3a336dab062fcd7`
- `mcp/assets/index.html`: `4adbf99ffdb7d24149c7c3ff678453354a147fd3d5eaf8f6b7d459e2e3df0230`

## Residual risk

- The current Codex task cannot hot-reload the newly installed plugin; beta.4 requires a new task for actual-host verification.
- Internal submission avoids the known follow-up-message dialog, but whether the host automatically starts the next model turn is not guaranteed and requires a new-task test.
- Keyboard-only, real screen-reader, host state recovery, and comparative user testing remain pending.
- The three moderate npm advisories remain transitively present. The documented `@hono/node-server` path is not used by the stdio runtime, but a stable release remains blocked until the dependency exposure is removed or isolated.
