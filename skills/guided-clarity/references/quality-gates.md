# Quality gates

Use these gates to keep Guided Clarity from degrading into a generic questionnaire.

## Before asking

- The answer is not already confirmed.
- The answer can change a decision, constraint, risk, or next action.
- This is the highest-value unresolved question available.
- Guided choices are the default; a primary open response has a concrete reason.
- The decision-shape test was applied: single-choice options are pairwise exclusive; compatible or layered components use multiple choice; priority uses ranking.
- A multi-select maximum is omitted unless a real constraint exists; any restrictive maximum has a visible `selectionLimitReason` and counts `Other` explicitly.
- The coaching-quality rubric passes: contextual, generative, neutral, consequential, answerable, and actionable.
- Two to four options cover the materially different paths without cosmetic duplication.
- A native selector is used when available, and a written `Other` path is always available.
- When a native question tool is callable, the question or microsequence is delivered through it and not duplicated in assistant prose.
- Every question placed in one microsequence remains valid under every answer to earlier questions; a material branch ends the block.
- The question, tradeoffs, and recommendation rationale are understandable on one phone screen whenever the subject permits it.
- The user can normally answer in under 30 seconds.
- A selection can be answered by clicking/tapping or by a short code such as `B` or `A+C`; it never requires typing `confirm`, `yes`, or restating the option.
- The question turn contains no file list, Git log, validation report, hash, or unrelated completion summary.

## Before recommending

- The user's relevant priorities or decision criteria are confirmed.
- Evidence is sufficient for a recommendation; otherwise present tradeoffs only.
- When evidence and confirmed criteria are sufficient, one recommendation is visibly marked; omitting it is a failure.
- When evidence is insufficient, the missing fact is named; inventing a recommendation is a failure.
- The recommended option includes its material downside.
- The rationale is separate from the localized `(Recommended)` or `(Recomendado)` label.
- The recommendation remains an AI proposal until the user confirms it.
- Confirmation occurs by selecting the recommended option or combination, not by a separate free-form confirmation step.
- A recommended option has both a separate rationale and a visible material downside.

## Before persisting

- Confirmed, Inferred, and Unknown are not mixed.
- The source and date of a material user decision are recorded.
- No secret, authentication material, or unnecessary personal data is written.
- Contradictions are preserved rather than silently reconciled.
- The exact next question is recorded so another session can resume.
- A structured MCP answer matches the active question ID, kind, option IDs, and selection bounds before it is persisted.
- A retrieved session answer replaces any earlier answer with the same `questionId`; missing answers remain Unknown, including after `Finish`.

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
