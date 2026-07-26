import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { GuidedAnswer, GuidedQuestion } from "../../shared/question";
import { validateAnswer, validateQuestion } from "../../shared/question";
import "./styles.css";

type Status = "idle" | "sending" | "sent" | "error";
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
  es: { recommended: "Recomendado", other: "Otra respuesta", placeholder: "Escribe tu respuesta…", submit: "Continuar", sending: "Enviando…", sent: "Respuesta enviada", error: "No se pudo enviar. Intenta de nuevo.", invalid: "La pregunta no se pudo mostrar de forma segura.", why: "Por qué importa", downside: "A tener en cuenta", moveUp: "Subir", moveDown: "Bajar", chooseOne: "Elige una opción", chooseUpTo: "Puedes elegir hasta", chooseAtLeast: "Elige al menos", rank: "Ordena de mayor a menor prioridad", limit: "Límite de selecciones alcanzado", otherLabel: "Escribe otra respuesta" },
  en: { recommended: "Recommended", other: "Other answer", placeholder: "Write your answer…", submit: "Continue", sending: "Sending…", sent: "Answer sent", error: "Could not send. Try again.", invalid: "The question could not be displayed safely.", why: "Why it matters", downside: "Keep in mind", moveUp: "Move up", moveDown: "Move down", chooseOne: "Choose one option", chooseUpTo: "Choose up to", chooseAtLeast: "Choose at least", rank: "Order from highest to lowest priority", limit: "Selection limit reached", otherLabel: "Write another answer" },
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
  minSelections: previewKind === "rank" ? 3 : 1,
  maxSelections: previewKind === "single" ? 1 : 3,
  locale: "es",
} : null;

function App() {
  const [question, setQuestion] = useState<GuidedQuestion | null>(previewQuestion);
  const [selected, setSelected] = useState<string[]>(previewQuestion?.kind === "rank" ? previewQuestion.options.map((option) => option.id) : []);
  const [other, setOther] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [hostError, setHostError] = useState<string | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Intent Foundry", version: "0.2.0-beta.2" },
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
  const progressWidth = question.progress?.total
    ? Math.min(100, (question.progress.current / question.progress.total) * 100)
    : undefined;

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

  const submit = async () => {
    if (validationError) return;
    setStatus("sending");
    if (previewQuestion) {
      window.setTimeout(() => setStatus("sent"), 250);
      return;
    }
    try {
      const result = await app!.sendMessage({
        role: "user",
        content: [{ type: "text", text: `intent_foundry_answer_v1\n${JSON.stringify({ ...answer, other: answer.other ?? null })}` }],
      });
      setStatus(result.isError ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  };

  const orderedOptions = question.kind === "rank"
    ? selected.map((id) => question.options.find((option) => option.id === id)!).filter(Boolean)
    : question.options;

  return (
    <main className="shell">
      <section className="card" aria-labelledby="question-title">
        {question.progress && (
          <div className="progress-wrap" aria-label={question.progress.label}>
            <div className="progress-copy"><span>{question.progress.label}</span><span>{question.progress.current}{question.progress.total ? ` / ${question.progress.total}` : ""}</span></div>
            {progressWidth !== undefined && <div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={question.progress.total} aria-valuenow={question.progress.current}><div className="progress-bar" style={{ width: `${progressWidth}%` }} /></div>}
          </div>
        )}

        <h1 id="question-title">{question.question}</h1>
        {question.why && <details className="why"><summary>{t.why}</summary><p>{question.why}</p></details>}
        <p className="selection-hint" aria-live="polite">{question.kind === "single" ? t.chooseOne : question.kind === "rank" ? t.rank : atLimit ? t.limit : question.maxSelections ? `${t.chooseAtLeast} ${question.minSelections} · ${t.chooseUpTo} ${question.maxSelections}` : `${t.chooseAtLeast} ${question.minSelections}`}</p>

        <div className="options" role={question.kind === "single" ? "radiogroup" : question.kind === "multi" ? "group" : "list"}>
          {orderedOptions.map((option, index) => {
            const checked = selected.includes(option.id);
            const disabled = question.kind === "multi" && !checked && atLimit;
            return (
              <div className={`option ${checked ? "selected" : ""} ${option.recommended ? "recommended" : ""} ${disabled ? "disabled" : ""}`} key={option.id} role={question.kind === "rank" ? "listitem" : undefined}>
                {question.kind === "rank" ? (
                  <div className="rank-row">
                    <span className="rank-number">{index + 1}</span>
                    <OptionCopy option={option} recommendedLabel={t.recommended} downsideLabel={t.downside} />
                    <div className="rank-actions">
                      <button aria-label={`${t.moveUp}: ${option.label}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                      <button aria-label={`${t.moveDown}: ${option.label}`} disabled={index === orderedOptions.length - 1} onClick={() => move(index, 1)}>↓</button>
                    </div>
                  </div>
                ) : (
                  <label>
                    <input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={checked} disabled={disabled} onChange={() => choose(option.id)} />
                    <span className="control" aria-hidden="true" />
                    <OptionCopy option={option} recommendedLabel={t.recommended} downsideLabel={t.downside} />
                  </label>
                )}
              </div>
            );
          })}

          {question.otherAllowed && question.kind !== "rank" && (
            <div className={`option other ${otherOpen ? "selected" : ""}`}>
              <label>
                <input type={question.kind === "single" ? "radio" : "checkbox"} name={question.questionId} checked={otherOpen} disabled={!otherOpen && atLimit} onChange={() => { const next = !otherOpen; setOtherOpen(next); if (!next) setOther(""); if (question.kind === "single") setSelected([]); }} />
                <span className="control" aria-hidden="true" />
                <span className="option-copy"><strong>{t.other}</strong></span>
              </label>
              {otherOpen && <textarea autoFocus aria-label={t.otherLabel} maxLength={1000} value={other} onChange={(event) => setOther(event.target.value)} placeholder={t.placeholder} rows={2} />}
            </div>
          )}
        </div>

        {question.recommendationReason && <p className="recommendation-reason"><span>✦</span>{question.recommendationReason}</p>}

        <footer>
          <span className={`status ${status}`} role="status" aria-live="polite">{status === "sent" ? t.sent : status === "error" ? t.error : ""}</span>
          <button className="continue" disabled={Boolean(validationError) || status === "sending" || status === "sent"} onClick={submit}>
            {status === "sending" ? t.sending : t.submit}
          </button>
        </footer>
      </section>
    </main>
  );
}

function OptionCopy({ option, recommendedLabel, downsideLabel }: { option: GuidedQuestion["options"][number]; recommendedLabel: string; downsideLabel: string }) {
  return (
    <span className="option-copy">
      <span className="option-heading"><strong>{option.label}</strong>{option.recommended && <span className="badge">{recommendedLabel}</span>}</span>
      {option.description && <span className="description">{option.description}</span>}
      {option.downside && <span className="downside"><em>{downsideLabel}:</em> {option.downside}</span>}
    </span>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
