export type QuestionKind = "single" | "multi" | "rank";

export interface GuidedOption {
  id: string;
  label: string;
  description?: string;
  downside?: string;
  recommended?: boolean;
}

export interface GuidedQuestion {
  questionId: string;
  question: string;
  kind: QuestionKind;
  options: GuidedOption[];
  why?: string;
  progress?: { current: number; total?: number; label?: string };
  recommendationReason?: string;
  otherAllowed: boolean;
  minSelections: number;
  maxSelections?: number;
  locale: "es" | "en";
}

export interface GuidedAnswer {
  questionId: string;
  kind: QuestionKind;
  selected: string[];
  labels: string[];
  other?: string;
}

export function validateAnswer(question: GuidedQuestion, answer: GuidedAnswer): string | null {
  const optionIds = new Set(question.options.map((option) => option.id));
  if (answer.questionId !== question.questionId || answer.kind !== question.kind) {
    return "answer_mismatch";
  }
  if (answer.selected.some((id) => !optionIds.has(id))) return "unknown_option";
  if (new Set(answer.selected).size !== answer.selected.length) return "duplicate_option";
  if (answer.other?.trim() && !question.otherAllowed) return "other_not_allowed";

  const count = answer.selected.length + (answer.other?.trim() ? 1 : 0);
  if (question.kind === "rank" && answer.selected.length !== question.options.length) {
    return "rank_all_options";
  }
  if (count < question.minSelections) return "too_few_selections";
  if (question.maxSelections !== undefined && count > question.maxSelections) {
    return "too_many_selections";
  }
  return null;
}
