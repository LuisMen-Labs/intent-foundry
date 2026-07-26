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
5. Prepare the single highest-value unresolved question using [question-design.md](references/question-design.md). Apply [coaching-quality.md](references/coaching-quality.md) whenever the question concerns goals, beliefs, tradeoffs, risk, commitment, or a consequential decision.
6. Present guided choices through `present_guided_question` whenever that MCP tool is available. Follow [mcp-integration.md](references/mcp-integration.md) for the exact handoff and answer contract.
7. Capture the user's selection or correction, then classify it as Confirmed, Inferred, or Unknown.
8. Persist the answer before preparing the next question. Never record the AI's recommendation as the user's decision.
9. Adapt the next question to the new state, switch modes when justified, or stop when remaining unknowns are immaterial.
10. Match the user's language. Keep state and the final Intent Pack in that language unless the user requests another one.

## Make every question easy to answer

- Ask exactly one question per turn unless the user requests a batch.
- Encode progress in the card's compact progress indicator when available. Do not add a prose preamble merely to announce progress.
- Default to guided choices. Use free response as the primary format only when proposed options would materially bias or truncate the user's meaning.
- Use the platform's native single-choice or multi-choice control whenever available. If the control supplies an `Other` field, rely on it; otherwise include a free-write escape.
- Treat `present_guided_question` as the native control for this plugin. If it is callable, use it instead of printing simulated options in prose.
- Keep the default card visually silent: question, compact options, subtle progress, `Other`, and `Skip` only. Put rationale, tradeoffs, and coaching depth behind progressive disclosure so they remain available without burdening the first scan.
- Keep the question phone-friendly: two to four materially distinct choices, one-line tradeoffs, plain language, and no jargon dump.
- Always let the user write an answer that corrects, combines, or replaces the choices. Include `I don't know yet` when uncertainty is legitimate.
- Classify the decision shape before drafting: use `single` only when selecting one answer logically excludes every other answer on the same dimension; use `multi` for compatible policies, layered safeguards, features, symptoms, or anything that may be combined; use `rank` only when order itself is the decision.
- Run a pairwise compatibility check. If any two proposed options can reasonably coexist, split the dimensions or use multiple choice.
- For multiple choice, omit a maximum by default. Set one only when a real constraint exists and explain that constraint visibly; never invent a cap for brevity or visual simplicity.
- Make the question coaching-grade: reflect the user's context, expose one consequential assumption or tension, preserve agency, and unlock a decision, experiment, or evidence request. Never use therapy claims, manipulation, shame, manufactured urgency, or a recommendation disguised as a question.
- When evidence and confirmed criteria support a preference, **must** mark exactly one option or one combination with the localized suffix ` (Recommended)` or ` (Recomendado)`. Put the rationale and material downside outside the label.
- When evidence is insufficient, do not manufacture a recommendation. Say what fact is missing and offer a low-effort path to resolve it.
- Treat every recommendation as a proposal until the user explicitly selects or confirms it.
- In a textual fallback, accept one letter for single choice and combinations such as `A+C` for multiple choice. Never replace a selection with instructions to type `confirm`, `yes`, an option label, or another arbitrary word.
- If host policy forbids textual choices and no native selector exists, pause the question and state that the required selection interface is unavailable. Do not degrade it into an open confirmation prompt or pretend choices were shown.
- Choose for information gain: ask what most reduces consequential uncertainty, not what is easiest to ask.

## Keep interview turns clean

- During an active interview, make the user-facing turn contain only the progress cue, one question, selectable choices, recommendation rationale, downside, and `Other` path.
- Persist state silently. Do not append modified-file lists, Git activity, hashes, validation logs, internal workflow, or a generic completion summary to a question turn.
- Report operational details only when the user asks, pauses, requests a handoff, or a material failure requires attention.
- Keep source citations out of the choice block. Include only the minimum evidence note needed to understand a high-stakes recommendation.
- After calling the MCP question tool, do not repeat its question, choices, or a second assistant summary. Wait for the submitted answer.
- Treat `Skip` as Unknown, never as rejection or confirmation. Preserve the unanswered decision and adapt, park, or revisit it according to impact.

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
Other: write what fits better.
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
