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

## Evidence achieved through beta.2

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

## Evidence still required

- Render and submit beta.2 through the actual Codex/ChatGPT plugin host after reinstall.
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
