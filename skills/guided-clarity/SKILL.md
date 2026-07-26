---
name: guided-clarity
description: Turn vague ideas, complex choices, incomplete requirements, and uncertain plans into verified, portable intent through one adaptive question at a time. Use when the user wants guided clarification, decision support, assumption checking, requirements discovery, an adversarial review, or a durable handoff that another chat, device, model, or agent can continue.
---

# Guided Clarity

Help the user understand and express what they mean before an AI acts. Treat the interview as the mechanism and a verified, portable Intent Pack as the result.

## Run the flow

1. Read relevant conversation and project context before asking anything.
2. Do not repeat facts the user already confirmed.
3. Select one mode from [modes.md](references/modes.md): Discover, Decide, Challenge, or Audit. Combine modes only when the task requires it.
4. If filesystem access exists, reuse the project's state file or copy [INTERVIEW_STATE.template.md](assets/INTERVIEW_STATE.template.md). Otherwise maintain a compact state in the conversation.
5. Prepare the single highest-value unresolved question using [question-design.md](references/question-design.md).
6. Present guided choices, capture the user's selection or correction, then classify it as Confirmed, Inferred, or Unknown.
7. Persist the answer before preparing the next question. Never record the AI's recommendation as the user's decision.
8. Adapt the next question to the new state, switch modes when justified, or stop when remaining unknowns are immaterial.
9. Match the user's language. Keep state and the final Intent Pack in that language unless the user requests another one.

## Make every question easy to answer

- Ask exactly one question per turn unless the user requests a batch.
- Begin with a brief progress cue: what is already clear and what this answer unlocks.
- Default to guided choices. Use free response as the primary format only when proposed options would materially bias or truncate the user's meaning.
- Use the platform's native single-choice or multi-choice control whenever available. If the control supplies an `Other` field, rely on it; otherwise include a free-write escape.
- Keep the question phone-friendly: two to four materially distinct choices, one-line tradeoffs, plain language, and no jargon dump.
- Always let the user write an answer that corrects, combines, or replaces the choices. Include `I don't know yet` when uncertainty is legitimate.
- For single choice, make alternatives mutually exclusive. For multiple choice, label it clearly and make alternatives independently selectable.
- When evidence and confirmed criteria support a preference, **must** mark exactly one option or one combination with the localized suffix ` (Recommended)` or ` (Recomendado)`. Put the rationale and material downside outside the label.
- When evidence is insufficient, do not manufacture a recommendation. Say what fact is missing and offer a low-effort path to resolve it.
- Treat every recommendation as a proposal until the user explicitly selects or confirms it.
- If host policy forbids textual choices and no native selector exists, state the interface limitation briefly and ask the smallest possible free response. Do not pretend choices were shown.
- Choose for information gain: ask what most reduces consequential uncertainty, not what is easiest to ask.

Use this compact fallback only when the host permits textual choices:

```text
Question N · Topic
Already clear: short progress cue.
Why it matters: concrete consequence.
Choose one / Choose any:
A. Option — tradeoff
B. Option — tradeoff (Recommended)
C. I don't know yet — what would help decide

Why B: evidence or decision criterion. Downside: material cost or risk.
Other answer: write what fits better.
```

## Verify rather than fill gaps

- Classify material information as **Confirmed**, **Inferred**, or **Unknown**.
- Interpret a selected label, letter, combination, or custom answer without forcing it into a predefined option. Ask a short confirmation only when ambiguity would materially change the result.
- Reopen a prior answer only when new context creates a material contradiction.
- For consequential decisions, test what must be true, what would falsify it, which incentives may distort it, and what downside is hidden by vague language or averages.
- Separate evidence from inference. Research current or high-impact claims before using them as premises.
- Make tensions explicit without treating every tension as a logical contradiction.

## Persist after every answer

When a writable project is available, update the state immediately using the safest available editing tool:

- confirmed answer, date, and user as source;
- unresolved questions and the next highest-value question;
- inferences awaiting confirmation;
- contradictions, biases, and falsifiers;
- decisions materially changed by the answer.

Do not store passwords, tokens, cookies, private keys, seed phrases, authentication material, or unnecessary personal data. Warn the user and redact any such value from durable state.

When no filesystem is available, maintain the same fields internally and provide a copyable checkpoint whenever the user pauses.

Durable continuity is capability-dependent: never claim automatic cross-device synchronization. Export or commit the Intent Pack so the user can deliberately carry it to another environment.

## Produce the Intent Pack

Pause cleanly when asked. On completion, generate a human-readable, model-portable artifact using [INTENT_PACK.template.md](assets/INTENT_PACK.template.md). Follow [portability.md](references/portability.md) when another chat, tool, or model will consume it.

Do not declare completion while a blocking ambiguity remains. The final pack must state:

- desired outcome and success criteria;
- confirmed decisions and constraints;
- rejected alternatives with reasons;
- assumptions, unknowns, contradictions, and evidence needs;
- permissions and prohibited actions;
- next action and exact resume point;
- provenance and last-updated date.

Apply the gates in [quality-gates.md](references/quality-gates.md) before recommending, persisting, or completing. End with a short verification question so the user can correct the pack before it controls downstream work.
