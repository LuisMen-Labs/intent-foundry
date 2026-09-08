import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { GuidedAnswer, GuidedQuestion } from "../../shared/question";
import { validateAnswer, validateQuestion } from "../../shared/question";
import type { GuidedSession } from "../../shared/session";
import { validateSession } from "../../shared/session";
import { deliverGuidedAnswer } from "./delivery";
import { restoreSession, type Draft, type PersistedState } from "./session-state";
import "./styles.css";

type Status = "idle" | "sending" | "sent" | "server-error";
type SessionSource = "single" | "sequence";
type UiSession = GuidedSession & { source: SessionSource };

declare global {
  interface Window {
    openai?: {
      widgetState?: PersistedState;
      setWidgetState?: (state: PersistedState) => void;
    };
  }
}

const copy = {
  es: { recommended: "Recomendado", other: "Algo más", placeholder: "Escribe lo que encaja mejor…", previous: "Anterior", next: "Siguiente", finish: "Finalizar", retry: "Reintentar", skip: "Omitir", sending: "Guardando…", sent: "Respuesta guardada", finished: "Sesión finalizada", answersSaved: "respuestas guardadas.", resume: "Para verificarlas y continuar con el proceso, vuelve al chat y escribe «Verificar respuestas».", blockReady: "Bloque completado", blockReadyDetail: "Las respuestas están guardadas. Puedes revisarlas o finalizar este bloque.", serverError: "No se pudo confirmar el guardado. Tu selección sigue aquí; reintenta o pide verificar la sesión en el chat.", invalid: "La pregunta no se pudo mostrar de forma segura.", details: "Ver criterio", why: "Por qué importa", downside: "A tener en cuenta", moveUp: "Subir", moveDown: "Bajar", otherLabel: "Escribe otra respuesta", invalidSelection: "La selección necesita una corrección" },
  en: { recommended: "Recommended", other: "Something else", placeholder: "Write what fits better…", previous: "Previous", next: "Next", finish: "Finish", retry: "Retry", skip: "Skip", sending: "Saving…", sent: "Answer saved", finished: "Session finished", answersSaved: "answers saved.", resume: "To review them and continue the process, return to the chat and type “Review answers”.", blockReady: "Block complete", blockReadyDetail: "Your answers are saved. You can review them or finish this block.", serverError: "Saving could not be confirmed. Your selection is still here; retry or ask the chat to verify the session.", invalid: "The question could not be displayed safely.", details: "View rationale", why: "Why it matters", downside: "Keep in mind", moveUp: "Move up", moveDown: "Move down", otherLabel: "Write another answer", invalidSelection: "The selection needs correction" },
};

const previewKind = new URLSearchParams(window.location.search).get("preview");
const previewQuestion: GuidedQuestion | null = previewKind ? {
  questionId: "R-023",
  question: "¿Qué función de coste debe gobernar la calibración?",
  kind: previewKind === "rank" ? "rank" : previewKind === "single" ? "single" : "multi",
  options: [
    { id: "A", label: "Seguridad lexicográfica", description: "Limita primero falsos PASS críticos.", downside: "Puede eliminar demasiada opcionalidad.", recommended: true },
    { id: "B", label: "Coste monetario común", description: "Pondera ambos errores en una función." },
    { id: "C", label: "Híbrida por criticidad", description: "Combina límites críticos y coste no crítico." },
  ],
  why: "La política debe proteger liquidez sin volver inútil el detector.",
  progress: { current: 1, total: 3, label: "Calibración" },
  recommendationReason: "Separa riesgos de ruina y oportunidad perdida.",
  otherAllowed: previewKind !== "rank",
  allowSkip: true,
  minSelections: previewKind === "rank" ? 3 : 1,
  maxSelections: previewKind === "single" ? 1 : previewKind === "rank" ? 3 : undefined,
  locale: "es",
} : null;

const previewSession: UiSession | null = previewQuestion ? {
  marker: "intent_foundry_session_v1",
  sessionId: "preview-session",
  source: "sequence",
  questions: [
    previewQuestion,
    { ...previewQuestion, questionId: "R-024", question: "¿Cómo debe fijarse la criticidad de cada puerta?", progress: { current: 2, total: 3, label: "Calibración" } },
    { ...previewQuestion, questionId: "R-025", question: "¿Qué evidencia debe congelarse antes del holdout?", progress: { current: 3, total: 3, label: "Calibración" } },
  ],
} : null;

const emptyDraft = (question: GuidedQuestion): Draft => ({
  selected: question.kind === "rank" ? question.options.map((option) => option.id) : [],
  other: "",
  otherOpen: false,
});

function App() {
  const [session, setSession] = useState<UiSession | null>(previewSession);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => previewQuestion ? { [previewQuestion.questionId]: emptyDraft(previewQuestion) } : {});
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [finalized, setFinalized] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const initialized = useRef<string | null>(null);
  const loadingToken = useRef(0);
  const busy = useRef(false);
  const [hostError, setHostError] = useState<string | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Intent Foundry", version: "0.2.0-beta.12" },
    capabilities: {},
    onAppCreated: (created: McpApp) => {
      created.ontoolresult = async (result) => {
        const payload = result.structuredContent as unknown as Record<string, unknown>;
        if (payload?.marker === "intent_foundry_session_state_v1") return;

        let nextSession: UiSession;
        if (payload?.marker === "intent_foundry_session_v1" && Array.isArray(payload.questions)) {
          const candidate = payload as unknown as GuidedSession;
          const sessionError = validateSession(candidate);
          if (sessionError) {
            setHostError(sessionError);
            return;
          }
          nextSession = { ...candidate, source: "sequence" };
        } else {
          const next = payload as unknown as GuidedQuestion;
          let nextError: string | null;
          try {
            nextError = validateQuestion(next);
          } catch {
            setHostError("malformed_structured_question");
            return;
          }
          if (nextError) {
            setHostError(nextError);
            return;
          }
          nextSession = { marker: "intent_foundry_session_v1", sessionId: next.questionId, questions: [next], source: "single" };
        }

        const signature = JSON.stringify(nextSession);
        if (initialized.current === signature) return;
        const token = ++loadingToken.current;
        setHostError(null);
        setRecoveryError(null);
        setSession(nextSession);
        setLoading(true);
        try {
          let saved: PersistedState | undefined;
          if (nextSession.source === "sequence") {
            const result = await created.callServerTool({ name: "read_guided_session", arguments: { sessionId: nextSession.sessionId } });
            if (result.isError) throw new Error("session_unavailable");
            saved = restoreSession(nextSession, result.structuredContent, window.openai?.widgetState);
          } else {
            const cached = window.openai?.widgetState;
            if (cached?.sessionId === nextSession.sessionId) saved = cached;
          }
          if (token !== loadingToken.current) return;
          setCurrentIndex(saved ? saved.currentIndex : 0);
          setDrafts(saved ? saved.drafts : Object.fromEntries(nextSession.questions.map((question) => [question.questionId, emptyDraft(question)])));
          setSavedIds(saved?.savedIds ?? []);
          setFinalized(saved?.finalized ?? false);
          setStatus("idle");
          initialized.current = signature;
        } catch {
          if (token === loadingToken.current) setRecoveryError(nextSession.questions[0].locale === "es"
            ? "No se pudo recuperar la sesión. No vuelvas a responder: pide en el chat verificar la sesión guardada."
            : "The session could not be restored. Do not answer again: ask the chat to verify the saved session.");
        } finally {
          if (token === loadingToken.current) setLoading(false);
        }
      };
    },
  });

  useEffect(() => {
    if (!session || loading || recoveryError) return;
    window.openai?.setWidgetState?.({ sessionId: session.sessionId, currentIndex, drafts, savedIds, finalized, completedCheckpoints: [] });
  }, [session, currentIndex, drafts, savedIds, finalized, loading, recoveryError]);

  const runAction = async (action: () => Promise<unknown>) => {
    if (busy.current) return;
    busy.current = true;
    try { await action(); } finally { busy.current = false; }
  };


  if ((error || hostError) && !previewSession) return <div className="state error" role="alert">{document.documentElement.lang.startsWith("en") ? copy.en.invalid : copy.es.invalid}</div>;
  if (loading) return <div className="state" role="status">{session?.questions[0].locale === "en" ? "Restoring saved answers…" : "Recuperando respuestas guardadas…"}</div>;
  if (recoveryError) return <div className="state error" role="alert">{recoveryError}</div>;
  if ((!app && !previewSession) || !session) return <div className="state">Connecting…</div>;

  const question = session.questions[currentIndex];
  const locale = question?.locale ?? session.questions[0].locale;
  const t = copy[locale];

  const finalizeSession = async () => {
    setStatus("sending");
    if (!previewSession && session.source === "sequence") {
      const result = await deliverGuidedAnswer({
        submit: () => app!.callServerTool({ name: "finalize_guided_session", arguments: { sessionId: session.sessionId } }),
        reconcile: async () => {
          const result = await app!.callServerTool({ name: "read_guided_session", arguments: { sessionId: session.sessionId } });
          if (result.isError) return false;
          const restored = restoreSession(session, result.structuredContent);
          if (restored.finalized) setSavedIds(restored.savedIds);
          return restored.finalized;
        },
      });
      if (!result.serverAccepted) {
        setStatus("server-error");
        return false;
      }
    }
    setFinalized(true);
    setStatus("sent");
    return true;
  };

  if (finalized || currentIndex >= session.questions.length) {
    return (
      <main className="shell">
        <section className="card completion" aria-labelledby="completion-title">
          <div className="completion-copy">
            <h1 id="completion-title">{finalized ? t.finished : t.blockReady}</h1>
            {finalized
              ? <p><strong>{savedIds.length} de {session.questions.length}</strong> {t.answersSaved} {t.resume}</p>
              : <p>{t.blockReadyDetail}</p>}
          </div>
          <footer>
            <button className="previous" disabled={finalized || session.questions.length === 0} onClick={() => { setCurrentIndex(session.questions.length - 1); setStatus("sent"); }}>{t.previous}</button>
            <span className={`status ${status}`} role="status">{status === "server-error" ? t.serverError : t.sent}</span>
            {!finalized && <button className="finish" onClick={() => runAction(finalizeSession)} disabled={status === "sending"}>{t.finish}</button>}
          </footer>
        </section>
      </main>
    );
  }

  const draft = drafts[question.questionId] ?? emptyDraft(question);
  const byId = new Map(question.options.map((option) => [option.id, option.label]));
  const answer: GuidedAnswer = {
    questionId: question.questionId,
    kind: question.kind,
    selected: draft.selected,
    labels: draft.selected.map((id) => byId.get(id) ?? id),
    ...(draft.otherOpen && draft.other.trim() ? { other: draft.other.trim() } : {}),
  };
  const validationError = validateAnswer(question, answer);
  const selectionCount = draft.selected.length + (draft.otherOpen ? 1 : 0);
  const atLimit = question.maxSelections !== undefined && selectionCount >= question.maxSelections;

  const updateDraft = (change: (current: Draft) => Draft) => {
    setDrafts((current) => ({ ...current, [question.questionId]: change(current[question.questionId] ?? emptyDraft(question)) }));
    setSavedIds((current) => current.filter((id) => id !== question.questionId));
    setStatus("idle");
  };

  const choose = (id: string) => updateDraft((current) => {
    if (question.kind === "single") return { selected: [id], other: "", otherOpen: false };
    if (question.kind !== "multi") return current;
    if (current.selected.includes(id)) return { ...current, selected: current.selected.filter((item) => item !== id) };
    const used = current.selected.length + (current.otherOpen ? 1 : 0);
    if (question.maxSelections !== undefined && used >= question.maxSelections) return current;
    return { ...current, selected: [...current.selected, id] };
  });

  const move = (index: number, direction: -1 | 1) => updateDraft((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.selected.length) return current;
    const selected = [...current.selected];
    [selected[index], selected[target]] = [selected[target], selected[index]];
    return { ...current, selected };
  });

  const saveAnswer = async (nextAnswer: GuidedAnswer): Promise<boolean> => {
    setStatus("sending");
    if (previewSession) {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      setSavedIds((current) => Array.from(new Set([...current, nextAnswer.questionId])));
      setStatus("sent");
      return true;
    }
    let observedFinalized = false;
    const result = await deliverGuidedAnswer({
      submit: () => app!.callServerTool(session.source === "sequence" ? {
        name: "save_guided_session_answer",
        arguments: { sessionId: session.sessionId, answer: nextAnswer },
      } : {
        name: "submit_guided_answer",
        arguments: { question, answer: nextAnswer },
      }),
      reconcile: session.source === "sequence" ? async () => {
        const result = await app!.callServerTool({ name: "read_guided_session", arguments: { sessionId: session.sessionId } });
        if (result.isError) return false;
        const restored = restoreSession(session, result.structuredContent);
        const stored = (result.structuredContent as unknown as { answers: GuidedAnswer[] }).answers.find((item) => item.questionId === nextAnswer.questionId);
        if (restored.finalized) {
          observedFinalized = true;
          setFinalized(true);
          setSavedIds(restored.savedIds);
          setDrafts(restored.drafts);
        }
        return Boolean(stored && stored.kind === nextAnswer.kind
          && Boolean(stored.skipped) === Boolean(nextAnswer.skipped)
          && (stored.other ?? "") === (nextAnswer.other ?? "")
          && JSON.stringify(stored.kind === "multi" ? [...stored.selected].sort() : stored.selected)
            === JSON.stringify(nextAnswer.kind === "multi" ? [...nextAnswer.selected].sort() : nextAnswer.selected));
      } : undefined,
    });
    if (result.serverAccepted) setSavedIds((current) => Array.from(new Set([...current, nextAnswer.questionId])));
    setStatus(result.status);
    return result.serverAccepted && !observedFinalized;
  };

  const saveCheckpointIfBoundary = async (): Promise<boolean> => {
    const checkpoint = session.checkpoints?.find((item) => item.throughQuestionId === question.questionId);
    if (!checkpoint || previewSession) return true;
    setStatus("sending");
    try {
      const result = await app!.callServerTool({
        name: "checkpoint_guided_session",
        arguments: { sessionId: session.sessionId, checkpointId: checkpoint.checkpointId },
      });
      if (result.isError) {
        setStatus("server-error");
        return false;
      }
      return true;
    } catch {
      setStatus("server-error");
      return false;
    }
  };


  const next = async () => {
    if (validationError) return;
    if (await saveAnswer(answer)) {
      if (!(await saveCheckpointIfBoundary())) return;
      setCurrentIndex((index) => index + 1);
      setStatus("idle");
    }
  };

  const skip = async () => {
    if (!question.allowSkip) return;
    const skipped: GuidedAnswer = { questionId: question.questionId, kind: question.kind, selected: [], labels: [], skipped: true };
    if (await saveAnswer(skipped)) {
      if (!(await saveCheckpointIfBoundary())) return;
      setCurrentIndex((index) => index + 1);
      setStatus("idle");
    }
  };

  const orderedOptions = question.kind === "rank"
    ? draft.selected.map((id) => question.options.find((option) => option.id === id)!).filter(Boolean)
    : question.options;

  const globalCurrent = question.progress?.current ?? currentIndex + 1;
  const globalTotal = question.progress?.total ?? session.questions.length;
  const blockIndex = session.checkpoints?.findIndex((checkpoint) => {
    const throughIndex = session.questions.findIndex((candidate) => candidate.questionId === checkpoint.throughQuestionId);
    return currentIndex <= throughIndex;
  }) ?? -1;
  const progressText = session.checkpoints && blockIndex >= 0
    ? `${locale === "es" ? "Pregunta" : "Question"} ${globalCurrent} de ${globalTotal} · ${locale === "es" ? "Bloque" : "Block"} ${blockIndex + 1} de ${session.checkpoints.length}`
    : `${globalCurrent} de ${globalTotal}`;

  return (
    <main className="shell">
      <section className="card" aria-labelledby="question-title">
        <header className="question-header">
          <h1 id="question-title">{question.question}</h1>
          <span className="progress-copy" aria-label={question.progress?.label}>{progressText}</span>
        </header>

        <div className="options" role={question.kind === "single" ? "radiogroup" : question.kind === "multi" ? "group" : "list"}>
          {orderedOptions.map((option, index) => {
            const checked = draft.selected.includes(option.id);
            const disabled = question.kind === "multi" && !checked && atLimit;
            return (
              <div className={`option ${checked ? "selected" : ""} ${option.recommended ? "recommended" : ""} ${disabled ? "disabled" : ""}`} key={option.id} role={question.kind === "rank" ? "listitem" : undefined}>
                {question.kind === "rank" ? (
                  <div className="rank-row"><span className="rank-number">{index + 1}</span><OptionCopy option={option} selected={true} recommendedLabel={t.recommended} downsideLabel={t.downside} /><div className="rank-actions"><button aria-label={`${t.moveUp}: ${option.label}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button aria-label={`${t.moveDown}: ${option.label}`} disabled={index === orderedOptions.length - 1} onClick={() => move(index, 1)}>↓</button></div></div>
                ) : (
                  <label><input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={checked} disabled={disabled || status === "sending"} onChange={() => choose(option.id)} /><span className="choice-key" aria-hidden="true">{option.id}</span><OptionCopy option={option} selected={checked} recommendedLabel={t.recommended} downsideLabel={t.downside} /></label>
                )}
              </div>
            );
          })}

          {question.otherAllowed && question.kind !== "rank" && (
            <div className={`other ${draft.otherOpen ? "selected" : ""}`}><label><input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={draft.otherOpen} disabled={status === "sending" || (!draft.otherOpen && atLimit)} onChange={() => updateDraft((current) => { const otherOpen = !current.otherOpen; return { selected: question.kind === "single" ? [] : current.selected, other: otherOpen ? current.other : "", otherOpen }; })} /><span className="pencil" aria-hidden="true">✎</span><span className="option-copy">{t.other}</span></label>{draft.otherOpen && <textarea disabled={status === "sending"} autoFocus aria-label={t.otherLabel} maxLength={1000} value={draft.other} onChange={(event) => updateDraft((current) => ({ ...current, other: event.target.value }))} placeholder={t.placeholder} rows={2} />}</div>
          )}
        </div>

        {(question.why || question.recommendationReason || question.selectionLimitReason) && <details className="why"><summary>{t.details}</summary>{question.why && <p><strong>{t.why}:</strong> {question.why}</p>}{question.recommendationReason && <p><strong>{t.recommended}:</strong> {question.recommendationReason}</p>}{question.selectionLimitReason && <p>{question.selectionLimitReason}</p>}</details>}
        {validationError && validationError !== "too_few_selections" && <p className="selection-hint" role="alert">{t.invalidSelection}: {validationError}</p>}

        <footer>
          <button className="previous" disabled={currentIndex === 0 || status === "sending"} onClick={() => { setCurrentIndex((index) => index - 1); setStatus(savedIds.includes(session.questions[currentIndex - 1].questionId) ? "sent" : "idle"); }}>{t.previous}</button>
          <span className={`status ${status}`} role="status" aria-live="polite">{status === "sent" ? t.sent : status === "server-error" ? t.serverError : ""}</span>
          {question.allowSkip && <button className="skip" disabled={status === "sending"} onClick={() => runAction(skip)}>{t.skip}</button>}
          <button className="finish" disabled={Boolean(validationError) || status === "sending"} onClick={() => runAction(async () => { if (validationError) return; if (!validationError && !savedIds.includes(question.questionId) && !(await saveAnswer(answer))) return; if (!(await saveCheckpointIfBoundary())) return; await finalizeSession(); })}>{t.finish}</button>
          <button className="continue" disabled={Boolean(validationError) || status === "sending"} onClick={() => runAction(next)}>{status === "sending" ? t.sending : status === "server-error" ? t.retry : t.next}</button>
        </footer>
      </section>
    </main>
  );
}

function OptionCopy({ option, selected, recommendedLabel, downsideLabel }: { option: GuidedQuestion["options"][number]; selected: boolean; recommendedLabel: string; downsideLabel: string }) {
  return <span className="option-copy"><span className="option-heading"><strong>{option.label}</strong>{option.recommended && <span className="badge">{recommendedLabel}</span>}</span>{selected && option.description && <span className="description">{option.description}</span>}{selected && option.downside && <span className="downside"><em>{downsideLabel}:</em> {option.downside}</span>}</span>;
}

createRoot(document.getElementById("root")!).render(<App />);
