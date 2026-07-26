# Differentiation contract

Individual features are not claimed as unique. The integrated workflow is the product hypothesis.

| Capability | Operational implementation | Evaluation evidence |
|---|---|---|
| Adaptive dialogue | One highest-value unresolved question per turn | The next question changes after each answer |
| Native decision surface | Single-select, multi-select, ranking, `Other`, progress, and disabled-until-valid submit | Build, MCP smoke test, DOM accessibility snapshot, and click/submit test |
| Transparent recommendation | Localized label, separate reason, and visible downside | Exactly one recommendation when evidence supports it; no auto-confirmation |
| Epistemic separation | Confirmed, Inferred, and Unknown sections | Ambiguous answers remain unresolved |
| Adversarial reasoning | Contradictions, incentives, assumptions, biases, and falsifiers | High-conviction weak-evidence test case |
| Durable continuity | State updated after every material answer | Pause and resume without rereading the transcript |
| Model portability | Plain-Markdown Intent Pack and handoff prompt | Resume in another compatible model and compare preserved decisions |
| Controlled authority | Explicit permissions and prohibited actions | Completing an interview never authorizes execution |
| Privacy boundary | Secret prohibition and review warning | A fake token is never persisted |
| Quiet surface | Host-local draft state; durable writes stay silent during questions | No file, Git, hash, or workflow noise beside choices |
| Portable fallback | Guided codes or prose only when the host lacks MCP Apps and permits text choices | Equivalent decision semantics without claiming native UI |

## Claude parity and the superiority hypothesis

Anthropic documents native multiple-choice, multi-select, ranking, and typed-answer interfaces. Reaching parity therefore requires product UI, not prompt wording.

Intent Foundry's testable superiority hypothesis is the combination of that low-friction surface with:

- recommendation rationale and downside;
- confirmed/inferred/unknown separation;
- adversarial checks and falsifiers;
- explicit authority limits;
- silent continuity and a portable Intent Pack.

Do not market this hypothesis as proven. Stable release requires comparative user testing on completion time, abandonment, correction quality, perceived effort, and successful cross-session resume.

## Primary validation metrics

- first-question response rate;
- median response time per question type;
- completion or clean-pause rate;
- correction rate of AI inferences;
- Intent Pack export rate;
- successful resume rate in another session/model;
- repeat use at 7 and 30 days;
- secret-persistence and unauthorized-action failures, both targeted at zero.
