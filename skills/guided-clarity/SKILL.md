---
name: guided-clarity
description: Turn vague ideas, complex choices, incomplete requirements, and uncertain plans into verified, portable intent through one adaptive question at a time. Use when the user wants guided clarification, decision support, assumption checking, requirements discovery, an adversarial review, or a durable handoff that another chat, device, model, or agent can continue.
---

# Guided Clarity

Help the user understand and express what they mean before an AI acts. Treat the interview as the mechanism and a verified, portable Intent Pack as the result.

## Start

1. Read relevant conversation and project context before asking anything.
2. Do not repeat facts the user already confirmed.
3. Select one mode from [modes.md](references/modes.md): Discover, Decide, Challenge, or Audit. Combine modes only when the task requires it.
4. If filesystem access exists, reuse the project's state file or copy [INTERVIEW_STATE.template.md](assets/INTERVIEW_STATE.template.md). Otherwise maintain a compact state in the conversation.
5. State the purpose briefly and ask the single highest-value unresolved question.
6. Match the user's language. Keep state and the final Intent Pack in that language unless the user requests another one.

## Ask one question per turn

- Explain in one sentence why the answer changes the result.
- Use the response format that minimizes user effort without hiding relevant choices:
  - **Single choice:** mutually exclusive alternatives.
  - **Multiple choice:** independent alternatives that may be combined.
  - **Free response:** when predefined alternatives would constrain the user's meaning.
- Use the platform's native single-choice or multi-choice control when it is available and appropriate. Otherwise render the choices as plain text and accept letters, labels, combinations, or a written answer.
- Normally offer two to five concise alternatives. Always permit a written answer that corrects, combines, or replaces them.
- Include `I don't know yet` when uncertainty is legitimate.
- Mark at most one single-choice option with the exact localized suffix: ` (Recommended)` in English or ` (Recomendado)` in Spanish. For multiple choice, mark only the suggested combination. Explain the evidence or criterion separately.
- Never recommend merely to steer the user. When evidence is insufficient, show tradeoffs without a recommendation.
- Adapt the next question to the last confirmed answer. Do not dump the full questionnaire unless asked.

Use this compact pattern:

```text
Question N — Topic
Why it matters: concrete consequence.
Choose one / Choose any that apply:
A. Option — tradeoff
B. Option — tradeoff (Recommended)
C. I don't know yet — what would help decide

Why B: evidence or decision criterion.
Your own answer is always welcome.
```

## Verify rather than fill gaps

- Classify material information as **Confirmed**, **Inferred**, or **Unknown**.
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

End with a short verification question so the user can correct the pack before it controls downstream work.
