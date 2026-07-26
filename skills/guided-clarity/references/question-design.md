# Question design

Use this reference whenever preparing the next question.

## Sequence

1. Identify the unresolved fact with the highest decision impact.
2. Classify the decision shape using the test below; do not choose a format by habit.
3. Draft two to four materially different options from known context and realistic alternatives.
4. Add one short consequence or tradeoff to each option.
5. Apply the recommendation rule.
6. Add `Other`/free writing and, when legitimate, `I don't know yet`.
7. Remove jargon, duplicated options, long preambles, and anything already confirmed.

## Decision-shape test

Ask in order:

1. Does choosing one option logically reject every other option on the same decision dimension? Use `single`.
2. Can two or more options coexist as policies, safeguards, features, causes, or requirements? Use `multi`.
3. Is sequence or priority the decision? Use `rank`.
4. Would predefined options materially anchor or truncate the answer? Use the open-format exception.

Before emitting `single`, compare every option pair. If a reasonable user could truthfully want both, split the dimensions or change to `multi`. Prompts such as “qué componentes”, “cuáles aplican” or “qué debe combinar” normally signal `multi`.

For `multi`, omit `maxSelections` by default. A lower cap is valid only when a real constraint exists—budget, capacity, policy, time, or logical incompatibility—and `selectionLimitReason` states it in user-facing language. `Other` consumes one slot when a maximum exists. Never impose a cap merely to shorten the response.

## Recommendation rule

- Recommend when confirmed user priorities plus evidence or a transparent decision criterion distinguish an option.
- Mark exactly one option or one combination with `(Recommended)` or `(Recomendado)`.
- Explain the reason and main downside separately.
- If the evidence is insufficient, say exactly what is missing. Do not use a recommendation label.
- Never persist the recommendation as Confirmed until the user chooses it.

## Native controls

Prefer the host's native selector. Follow its option-count and label constraints. Put tradeoffs in descriptions and use its built-in `Other` response when present. Do not simulate buttons with prose when host policy prohibits textual multiple-choice questions.

When `present_guided_question` is available, read [mcp-integration.md](mcp-integration.md) and call it. Availability without invocation is an integration failure, not a native-selector success.

When native controls are unavailable but textual choices are allowed, use letters and accept `A`, `B`, or combinations such as `A+C`. Do not ask the user to type `confirm`, `yes`, or repeat an option label. When neither native nor textual selection is allowed, pause instead of converting the decision into an open prompt.

## Tone

- Acknowledge the last answer and show brief progress.
- Sound like a practical thinking partner, not a form.
- Ask one thing at a time and reveal technical depth only when it becomes useful.
- Avoid fake excitement, grading language, and gamification.
- Keep operational metadata out of an active question. Persistence, files, Git, validation, and internal steps remain silent until pause, handoff, failure, or explicit request.

## Open-format exception

Use a free response as the main format only for narratives, original wording, sensitive context, or cases where predefined choices would create anchoring or omit likely meanings. Even then, give a short example of the desired answer shape when safe.
