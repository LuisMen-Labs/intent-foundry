import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { GuidedAnswer, GuidedQuestion } from "../../shared/question";
import { validateAnswer, validateQuestion } from "../../shared/question";
import { deliverGuidedAnswer } from "./delivery";
import "./styles.css";

type Status = "idle" | "sending" | "sent" | "server-error" | "context-error";
type PersistedState = { questionId: string; selected: string[]; other: string };

declare global {
  interface Window {
    openai?: {
      widgetState?: PersistedState;
      setWidgetState?: (state: PersistedState) => void;
    };
  }
}

const copy = {
  es: { recommended: "Recomendado", other: "Algo más", placeholder: "Escribe lo que encaja mejor…", submit: "Continuar", retry: "Reintentar", skip: "Omitir", sending: "Enviando…", sent: "Respuesta enviada", serverError: "No se pudo validar la respuesta. Intenta de nuevo.", contextError: "Respuesta aceptada; falta entregarla al chat. Reintenta.", invalid: "La pregunta no se pudo mostrar de forma segura.", details: "Ver criterio", why: "Por qué importa", downside: "A tener en cuenta", moveUp: "Subir", moveDown: "Bajar", chooseOne: "Elige una opción", chooseUpTo: "Puedes elegir hasta", chooseAtLeast: "Elige al menos", rank: "Ordena de mayor a menor prioridad", limit: "Límite de selecciones alcanzado", otherLabel: "Escribe otra respuesta", invalidSelection: "La selección necesita una corrección" },
  en: { recommended: "Recommended", other: "Something else", placeholder: "Write what fits better…", submit: "Continue", retry: "Retry", skip: "Skip", sending: "Sending…", sent: "Answer sent", serverError: "The answer could not be validated. Try again.", contextError: "Answer accepted; delivery to the chat is pending. Retry.", invalid: "The question could not be displayed safely.", details: "View rationale", why: "Why it matters", downside: "Keep in mind", moveUp: "Move up", moveDown: "Move down", chooseOne: "Choose one option", chooseUpTo: "Choose up to", chooseAtLeast: "Choose at least", rank: "Order from highest to lowest priority", limit: "Selection limit reached", otherLabel: "Write another answer", invalidSelection: "The selection needs correction" },
};

const previewKind = new URLSearchParams(window.location.search).get("preview");
const previewQuestion: GuidedQuestion | null = previewKind ? {
  questionId: "R-013",
  question: "¿Qué límites deben detener automáticamente el sistema?",
  kind: previewKind === "rank" ? "rank" : previewKind === "single" ? "single" : "multi",
  options: [
    { id: "A", label: "Pérdida diaria + drawdown", description: "Detiene nuevas entradas al alcanzar cualquiera de los dos límites.", downside: "Puede detener temporalmente una estrategia válida durante una anomalía aislada.", recommended: true },
    { id: "B", label: "Solo pérdida diaria", description: "Se reinicia cada día y es fácil de auditar.", downside: "No protege contra deterioro acumulado entre días." },
    { id: "C", label: "Solo drawdown acumulado", description: "Protege el capital desde el máximo histórico.", downside: "Puede reaccionar tarde a una sesión anómala." },
  ],
  why: "Esta decisión define cuándo el sistema pierde permiso para abrir riesgo nuevo; no es una meta de rentabilidad.",
  progress: { current: 13, total: 18, label: "Política de riesgo" },
  recommendationReason: "Combinar ambos límites cubre pérdidas rápidas y deterioro acumulado sin depender de una sola señal.",
  otherAllowed: previewKind !== "rank",
  allowSkip: true,
  minSelections: previewKind === "rank" ? 3 : 1,
  maxSelections: previewKind === "single" ? 1 : previewKind === "rank" ? 3 : undefined,
  locale: "es",
} : null;

function App() {
  const [question, setQuestion] = useState<GuidedQuestion | null>(previewQuestion);
  const [selected, setSelected] = useState<string[]>(previewQuestion?.kind === "rank" ? previewQuestion.options.map((option) => option.id) : []);
  const [other, setOther] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [acceptedFingerprint, setAcceptedFingerprint] = useState<string | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Intent Foundry", version: "0.2.0-beta.5" },
    capabilities: {},
    onAppCreated: (created: McpApp) => {
      created.ontoolresult = (result) => {
        const next = result.structuredContent as unknown as GuidedQuestion;
        if (!next || typeof next !== "object" || !Array.isArray(next.options)) {
          setHostError("missing_structured_question");
          return;
        }
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
        setHostError(null);
        setQuestion(next);
        setAcceptedFingerprint(null);
        setStatus("idle");
        const saved = window.openai?.widgetState;
        if (saved?.questionId === next.questionId) {
          setSelected(saved.selected);
          setOther(saved.other);
          setOtherOpen(Boolean(saved.other));
        } else {
          setSelected(next.kind === "rank" ? next.options.map((option) => option.id) : []);
          setOther("");
          setOtherOpen(false);
        }
      };
    },
  });

  useEffect(() => {
    if (!question) return;
    window.openai?.setWidgetState?.({ questionId: question.questionId, selected, other });
  }, [question, selected, other]);

  const answer = useMemo<GuidedAnswer | null>(() => {
    if (!question) return null;
    const byId = new Map(question.options.map((option) => [option.id, option.label]));
    return {
      questionId: question.questionId,
      kind: question.kind,
      selected,
      labels: selected.map((id) => byId.get(id) ?? id),
      ...(otherOpen && other.trim() ? { other: other.trim() } : {}),
    };
  }, [question, selected, other, otherOpen]);

  if ((error || hostError) && !previewQuestion) return <div className="state error" role="alert">{document.documentElement.lang.startsWith("en") ? copy.en.invalid : copy.es.invalid}</div>;
  if ((!app && !previewQuestion) || !question || !answer) return <div className="state">Connecting…</div>;

  const t = copy[question.locale];
  const validationError = validateAnswer(question, answer);
  const selectionCount = selected.length + (otherOpen ? 1 : 0);
  const atLimit = question.maxSelections !== undefined && selectionCount >= question.maxSelections;
  const choose = (id: string) => {
    setStatus("idle");
    if (question.kind === "single") {
      setSelected([id]);
      setOtherOpen(false);
      setOther("");
      return;
    }
    if (question.kind === "multi") {
      setSelected((current) => {
        if (current.includes(id)) return current.filter((item) => item !== id);
        const used = current.length + (otherOpen ? 1 : 0);
        if (question.maxSelections !== undefined && used >= question.maxSelections) return current;
        return [...current, id];
      });
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    setSelected((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const sendAnswer = async (nextAnswer: GuidedAnswer) => {
    setStatus("sending");
    if (previewQuestion) {
      window.setTimeout(() => setStatus("sent"), 250);
      return;
    }
    const fingerprint = JSON.stringify(nextAnswer);
    const result = await deliverGuidedAnswer({
      submit: () => app!.callServerTool({
        name: "submit_guided_answer",
        arguments: { question, answer: nextAnswer },
      }),
      updateContext: () => app!.updateModelContext({
        content: [{ type: "text", text: `intent_foundry_answer_v1\n${JSON.stringify(nextAnswer)}` }],
        structuredContent: { marker: "intent_foundry_answer_v1", answer: nextAnswer },
      }),
    }, acceptedFingerprint === fingerprint);
    if (result.serverAccepted) setAcceptedFingerprint(fingerprint);
    setStatus(result.status);
  };

  const submit = async () => {
    if (validationError) return;
    await sendAnswer(answer);
  };

  const skip = async () => {
    if (!question.allowSkip) return;
    const skipped: GuidedAnswer = { questionId: question.questionId, kind: question.kind, selected: [], labels: [], skipped: true };
    await sendAnswer(skipped);
  };

  const orderedOptions = question.kind === "rank"
    ? selected.map((id) => question.options.find((option) => option.id === id)!).filter(Boolean)
    : question.options;

  return (
    <main className="shell">
      <section className="card" aria-labelledby="question-title">
        <header className="question-header">
          <h1 id="question-title">{question.question}</h1>
          {question.progress && <span className="progress-copy" aria-label={question.progress.label}>{question.progress.total ? `${question.progress.current} de ${question.progress.total}` : (question.progress.label || question.progress.current)}</span>}
        </header>

        <div className="options" role={question.kind === "single" ? "radiogroup" : question.kind === "multi" ? "group" : "list"}>
          {orderedOptions.map((option, index) => {
            const checked = selected.includes(option.id);
            const disabled = question.kind === "multi" && !checked && atLimit;
            return (
              <div className={`option ${checked ? "selected" : ""} ${option.recommended ? "recommended" : ""} ${disabled ? "disabled" : ""}`} key={option.id} role={question.kind === "rank" ? "listitem" : undefined}>
                {question.kind === "rank" ? (
                  <div className="rank-row">
                    <span className="rank-number">{index + 1}</span>
                    <OptionCopy option={option} selected={true} recommendedLabel={t.recommended} downsideLabel={t.downside} />
                    <div className="rank-actions">
                      <button aria-label={`${t.moveUp}: ${option.label}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                      <button aria-label={`${t.moveDown}: ${option.label}`} disabled={index === orderedOptions.length - 1} onClick={() => move(index, 1)}>↓</button>
                    </div>
                  </div>
                ) : (
                  <label>
                    <input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={checked} disabled={disabled} onChange={() => choose(option.id)} />
                    <span className="choice-key" aria-hidden="true">{option.id}</span>
                    <OptionCopy option={option} selected={checked} recommendedLabel={t.recommended} downsideLabel={t.downside} />
                  </label>
                )}
              </div>
            );
          })}

          {question.otherAllowed && question.kind !== "rank" && (
            <div className={`other ${otherOpen ? "selected" : ""}`}>
              <label>
                <input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={otherOpen} disabled={!otherOpen && atLimit} onChange={() => { const next = !otherOpen; setOtherOpen(next); if (!next) setOther(""); if (question.kind === "single") setSelected([]); }} />
                <span className="pencil" aria-hidden="true">✎</span>
                <span className="option-copy">{t.other}</span>
              </label>
              {otherOpen && <textarea autoFocus aria-label={t.otherLabel} maxLength={1000} value={other} onChange={(event) => setOther(event.target.value)} placeholder={t.placeholder} rows={2} />}
            </div>
          )}
        </div>

        {(question.why || question.recommendationReason || question.selectionLimitReason) && <details className="why"><summary>{t.details}</summary>{question.why && <p><strong>{t.why}:</strong> {question.why}</p>}{question.recommendationReason && <p><strong>{t.recommended}:</strong> {question.recommendationReason}</p>}{question.selectionLimitReason && <p>{question.selectionLimitReason}</p>}</details>}
        {validationError && validationError !== "too_few_selections" && <p className="selection-hint" role="alert">{t.invalidSelection}: {validationError}</p>}

        <footer>
          <span className={`status ${status}`} role="status" aria-live="polite">{status === "sent" ? t.sent : status === "server-error" ? t.serverError : status === "context-error" ? t.contextError : ""}</span>
          {question.allowSkip && <button className="skip" disabled={status === "sending" || status === "sent"} onClick={skip}>{t.skip}</button>}
          <button className="continue" disabled={Boolean(validationError) || status === "sending" || status === "sent"} onClick={submit}>
            {status === "sending" ? t.sending : status === "server-error" || status === "context-error" ? t.retry : t.submit}
          </button>
        </footer>
      </section>
    </main>
  );
}

function OptionCopy({ option, selected, recommendedLabel, downsideLabel }: { option: GuidedQuestion["options"][number]; selected: boolean; recommendedLabel: string; downsideLabel: string }) {
  return (
    <span className="option-copy">
      <span className="option-heading"><strong>{option.label}</strong>{option.recommended && <span className="badge">{recommendedLabel}</span>}</span>
      {selected && option.description && <span className="description">{option.description}</span>}
      {selected && option.downside && <span className="downside"><em>{downsideLabel}:</em> {option.downside}</span>}
    </span>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
