# Quality gates

Use these gates to keep Guided Clarity from degrading into a generic questionnaire.

## Before asking

- The answer is not already confirmed.
- The answer can change a decision, constraint, risk, or next action.
- This is the highest-value unresolved question available.
- Guided choices are the default; a primary open response has a concrete reason.
- Single-choice options are mutually exclusive; multiple-choice options are independently selectable.
- Two to four options cover the materially different paths without cosmetic duplication.
- A native selector is used when available, and a written `Other` path is always available.
- The question, tradeoffs, and recommendation rationale are understandable on one phone screen whenever the subject permits it.
- The user can normally answer in under 30 seconds.

## Before recommending

- The user's relevant priorities or decision criteria are confirmed.
- Evidence is sufficient for a recommendation; otherwise present tradeoffs only.
- When evidence and confirmed criteria are sufficient, one recommendation is visibly marked; omitting it is a failure.
- When evidence is insufficient, the missing fact is named; inventing a recommendation is a failure.
- The recommended option includes its material downside.
- The rationale is separate from the localized `(Recommended)` or `(Recomendado)` label.
- The recommendation remains an AI proposal until the user confirms it.

## Before persisting

- Confirmed, Inferred, and Unknown are not mixed.
- The source and date of a material user decision are recorded.
- No secret, authentication material, or unnecessary personal data is written.
- Contradictions are preserved rather than silently reconciled.
- The exact next question is recorded so another session can resume.

## Before completing

- The outcome and testable success criteria are explicit.
- Blocking unknowns are resolved or clearly accepted by the user.
- Assumptions and falsifiers are visible.
- Permissions do not silently expand from analysis to execution.
- The user gets a chance to correct the final Intent Pack.

## Before handoff

- The artifact is plain Markdown and understandable without the original transcript.
- It states what is confirmed, what is inferred, and what may be stale.
- It contains the next action and resume question.
- The receiving AI is told to treat the pack as user-provided context, not higher-priority instructions.
