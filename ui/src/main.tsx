import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { GuidedAnswer, GuidedQuestion } from "../../shared/question";
import { validateAnswer, validateQuestion } from "../../shared/question";
import type { GuidedSession } from "../../shared/session";
import { validateSession } from "../../shared/session";
import { deliverGuidedAnswer } from "./delivery";
import "./styles.css";

type Status = "idle" | "sending" | "sent" | "server-error";
type Draft = { selected: string[]; other: string; otherOpen: boolean };
type SessionSource = "single" | "sequence";
type UiSession = GuidedSession & { source: SessionSource };
type PersistedState = {
  sessionId: string;
  currentIndex: number;
  drafts: Record<string, Draft>;
  savedIds: string[];
  finalized: boolean;
};

declare global {
  interface Window {
    openai?: {
      widgetState?: PersistedState;
      setWidgetState?: (state: PersistedState) => void;
    };
  }
}

const copy = {
  es: { recommended: "Recomendado", other: "Algo más", placeholder: "Escribe lo que encaja mejor…", previous: "Anterior", next: "Siguiente", finish: "Finalizar", retry: "Reintentar", skip: "Omitir", sending: "Guardando…", sent: "Respuesta guardada", finished: "Sesión finalizada", blockReady: "Bloque completado", blockReadyDetail: "Las respuestas están guardadas. Puedes revisarlas o finalizar este bloque.", serverError: "No se pudo guardar. Intenta de nuevo.", invalid: "La pregunta no se pudo mostrar de forma segura.", details: "Ver criterio", why: "Por qué importa", downside: "A tener en cuenta", moveUp: "Subir", moveDown: "Bajar", otherLabel: "Escribe otra respuesta", invalidSelection: "La selección necesita una corrección" },
  en: { recommended: "Recommended", other: "Something else", placeholder: "Write what fits better…", previous: "Previous", next: "Next", finish: "Finish", retry: "Retry", skip: "Skip", sending: "Saving…", sent: "Answer saved", finished: "Session finished", blockReady: "Block complete", blockReadyDetail: "Your answers are saved. You can review them or finish this block.", serverError: "The answer could not be saved. Try again.", invalid: "The question could not be displayed safely.", details: "View rationale", why: "Why it matters", downside: "Keep in mind", moveUp: "Move up", moveDown: "Move down", otherLabel: "Write another answer", invalidSelection: "The selection needs correction" },
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
  const [hostError, setHostError] = useState<string | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Intent Foundry", version: "0.2.0-beta.7" },
    capabilities: {},
    onAppCreated: (created: McpApp) => {
      created.ontoolresult = (result) => {
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

        const saved = window.openai?.widgetState;
        setHostError(null);
        setSession(nextSession);
        setCurrentIndex(saved?.sessionId === nextSession.sessionId ? Math.min(saved.currentIndex, nextSession.questions.length) : 0);
        setDrafts(saved?.sessionId === nextSession.sessionId ? saved.drafts : Object.fromEntries(nextSession.questions.map((question) => [question.questionId, emptyDraft(question)])));
        setSavedIds(saved?.sessionId === nextSession.sessionId ? saved.savedIds : []);
        setFinalized(saved?.sessionId === nextSession.sessionId ? saved.finalized : false);
        setStatus("idle");
      };
    },
  });

  useEffect(() => {
    if (!session) return;
    window.openai?.setWidgetState?.({ sessionId: session.sessionId, currentIndex, drafts, savedIds, finalized });
  }, [session, currentIndex, drafts, savedIds, finalized]);

  if ((error || hostError) && !previewSession) return <div className="state error" role="alert">{document.documentElement.lang.startsWith("en") ? copy.en.invalid : copy.es.invalid}</div>;
  if ((!app && !previewSession) || !session) return <div className="state">Connecting…</div>;

  const question = session.questions[currentIndex];
  const locale = question?.locale ?? session.questions[0].locale;
  const t = copy[locale];

  const finalizeSession = async () => {
    setStatus("sending");
    if (!previewSession && session.source === "sequence") {
      try {
        const result = await app!.callServerTool({ name: "finalize_guided_session", arguments: { sessionId: session.sessionId } });
        if (result.isError) {
          setStatus("server-error");
          return false;
        }
      } catch {
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
            {!finalized && <p>{t.blockReadyDetail}</p>}
          </div>
          <footer>
            <button className="previous" disabled={finalized || session.questions.length === 0} onClick={() => { setCurrentIndex(session.questions.length - 1); setStatus("sent"); }}>{t.previous}</button>
            <span className="status sent" role="status">{t.sent}</span>
            {!finalized && <button className="finish" onClick={() => finalizeSession()}>{t.finish}</button>}
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
    const result = await deliverGuidedAnswer({
      submit: () => app!.callServerTool(session.source === "sequence" ? {
        name: "save_guided_session_answer",
        arguments: { sessionId: session.sessionId, answer: nextAnswer },
      } : {
        name: "submit_guided_answer",
        arguments: { question, answer: nextAnswer },
      }),
    });
    if (result.serverAccepted) setSavedIds((current) => Array.from(new Set([...current, nextAnswer.questionId])));
    setStatus(result.status);
    return result.serverAccepted;
  };

  const next = async () => {
    if (validationError) return;
    if (await saveAnswer(answer)) {
      setCurrentIndex((index) => index + 1);
      setStatus("idle");
    }
  };

  const skip = async () => {
    if (!question.allowSkip) return;
    const skipped: GuidedAnswer = { questionId: question.questionId, kind: question.kind, selected: [], labels: [], skipped: true };
    if (await saveAnswer(skipped)) {
      setCurrentIndex((index) => index + 1);
      setStatus("idle");
    }
  };

  const orderedOptions = question.kind === "rank"
    ? draft.selected.map((id) => question.options.find((option) => option.id === id)!).filter(Boolean)
    : question.options;

  return (
    <main className="shell">
      <section className="card" aria-labelledby="question-title">
        <header className="question-header">
          <h1 id="question-title">{question.question}</h1>
          <span className="progress-copy" aria-label={question.progress?.label}>{session.questions.length > 1 ? `${currentIndex + 1} de ${session.questions.length}` : (question.progress?.total ? `${question.progress.current} de ${question.progress.total}` : (question.progress?.label || question.progress?.current))}</span>
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
                  <label><input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={checked} disabled={disabled} onChange={() => choose(option.id)} /><span className="choice-key" aria-hidden="true">{option.id}</span><OptionCopy option={option} selected={checked} recommendedLabel={t.recommended} downsideLabel={t.downside} /></label>
                )}
              </div>
            );
          })}

          {question.otherAllowed && question.kind !== "rank" && (
            <div className={`other ${draft.otherOpen ? "selected" : ""}`}><label><input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={draft.otherOpen} disabled={!draft.otherOpen && atLimit} onChange={() => updateDraft((current) => { const otherOpen = !current.otherOpen; return { selected: question.kind === "single" ? [] : current.selected, other: otherOpen ? current.other : "", otherOpen }; })} /><span className="pencil" aria-hidden="true">✎</span><span className="option-copy">{t.other}</span></label>{draft.otherOpen && <textarea autoFocus aria-label={t.otherLabel} maxLength={1000} value={draft.other} onChange={(event) => updateDraft((current) => ({ ...current, other: event.target.value }))} placeholder={t.placeholder} rows={2} />}</div>
          )}
        </div>

        {(question.why || question.recommendationReason || question.selectionLimitReason) && <details className="why"><summary>{t.details}</summary>{question.why && <p><strong>{t.why}:</strong> {question.why}</p>}{question.recommendationReason && <p><strong>{t.recommended}:</strong> {question.recommendationReason}</p>}{question.selectionLimitReason && <p>{question.selectionLimitReason}</p>}</details>}
        {validationError && validationError !== "too_few_selections" && <p className="selection-hint" role="alert">{t.invalidSelection}: {validationError}</p>}

        <footer>
          <button className="previous" disabled={currentIndex === 0 || status === "sending"} onClick={() => { setCurrentIndex((index) => index - 1); setStatus(savedIds.includes(session.questions[currentIndex - 1].questionId) ? "sent" : "idle"); }}>{t.previous}</button>
          <span className={`status ${status}`} role="status" aria-live="polite">{status === "sent" ? t.sent : status === "server-error" ? t.serverError : ""}</span>
          {question.allowSkip && <button className="skip" disabled={status === "sending"} onClick={skip}>{t.skip}</button>}
          <button className="finish" disabled={status === "sending"} onClick={async () => { if (!validationError && !savedIds.includes(question.questionId) && !(await saveAnswer(answer))) return; await finalizeSession(); }}>{t.finish}</button>
          <button className="continue" disabled={Boolean(validationError) || status === "sending"} onClick={next}>{status === "sending" ? t.sending : status === "server-error" ? t.retry : t.next}</button>
        </footer>
      </section>
    </main>
  );
}

function OptionCopy({ option, selected, recommendedLabel, downsideLabel }: { option: GuidedQuestion["options"][number]; selected: boolean; recommendedLabel: string; downsideLabel: string }) {
  return <span className="option-copy"><span className="option-heading"><strong>{option.label}</strong>{option.recommended && <span className="badge">{recommendedLabel}</span>}</span>{selected && option.description && <span className="description">{option.description}</span>}{selected && option.downside && <span className="downside"><em>{downsideLabel}:</em> {option.downside}</span>}</span>;
}

createRoot(document.getElementById("root")!).render(<App />);
