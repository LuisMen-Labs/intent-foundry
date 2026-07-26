# UX benchmark: Claude and Intent Foundry

Date: 2026-07-25

## Verified baseline

Anthropic documents clickable single-choice, multi-select, ranking, and typed-answer experiences in Claude. These are product capabilities, not behaviors created by a Skill.

OpenAI's plugin architecture supports the equivalent product layer through an MCP server returning an interactive component. The official examples demonstrate structured tool output, host-managed widget state, and messages sent from the component into the conversation.

## Intent Foundry acceptance contract

Parity requires:

- one question at a time;
- native single-select, multi-select, and ranking;
- a written `Other` path;
- progress and clear submission state;
- keyboard-accessible controls;
- no file/Git/workflow noise in the active question.

The differentiation hypothesis adds:

- one recommendation only when supported by confirmed criteria;
- visible recommendation reason and downside;
- explicit separation of confirmed, inferred, and unknown information;
- contradictions, incentives, bias, and falsifiers;
- explicit permission boundary;
- portable, reviewable project state.

## Evidence achieved through beta.8

- Single, multi, and rank component paths implemented.
- `Other`, progress, recommendation, reason, downside, and validation implemented.
- MCP list/call/resource smoke test passed.
- Accessibility DOM exposed named checkboxes and a disabled-until-valid button.
- Real browser click enabled submission and produced the success state.
- Dark theme and responsive CSS inspected locally.
- The installed plugin exposes `mcp__intentFoundry__present_guided_question` in a fresh Codex task.
- The Skill now requires that tool when callable and defines a versioned structured-answer envelope.
- Browser regression passed for single selection and submit, multi-selection cap, ranking reorder, mobile width without horizontal overflow, progress semantics, and zero console warnings/errors.
- Recommendation payloads now require both a reason and a material downside.
- The first scan is now a compact card with flat rows, discreet progress, inline `Other`, and no visible preamble.
- Descriptions, downsides, and coaching rationale use progressive disclosure instead of occupying the default view.
- `Skip` has a validated, backward-compatible payload and remains Unknown rather than becoming a false decision.
- Submission now uses only the internal MCP answer tool. It does not call `ui/message` or `ui/update-model-context`, removing both the follow-up-message dialog and the redundant acknowledgement stage by design; actual-host automatic continuation is still host-dependent.
- Local browser verification confirmed selection disclosure, three simultaneous compatible selections, enabled submission, and no horizontal overflow at the tested desktop width.
- Navigable microsequences now support Previous, Next, Finish, draft restoration, and answer revision by stable `questionId` without drafting a chat message.
- Browser regression verified a three-question sequence end to end: advance, restore, revise, complete, return from completion, and finalize.
- Responsive regression at 390 x 844 verified all four controls remain visible and the document width equals the viewport width.
- Beta.7 introduced a bounded, validated process-local answer queue and `read_guided_session`.
- Real use exposed that beta.7's process-local queue could disappear between the app tool call and the next model turn even though the card displayed a successful save.
- Beta.8 moves only the bounded session queue to a validated local temporary store and adds a two-process MCP regression that reproduces the host boundary.

## Evidence still required

- Render and submit beta.8 through a fresh actual Codex/ChatGPT plugin host after reinstall, verifying the complete microsequence and retrieval loop.
- Revisit/reload test for host widget-state recovery.
- Keyboard-only and screen-reader audit.
- Mobile host test.
- Comparative study against Claude using identical decision tasks.
- Metrics for time, abandonment, correction, satisfaction, and resume fidelity.

## Sources

- https://support.claude.com/en/articles/13641943-visual-and-interactive-content
- https://support.claude.com/en/articles/13454812-use-interactive-connectors-in-claude
- https://developers.openai.com/plugins/concepts/plugins
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://github.com/openai/openai-apps-sdk-examples
