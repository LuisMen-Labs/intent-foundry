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
  allowSkip?: boolean;
  minSelections: number;
  maxSelections?: number;
  selectionLimitReason?: string;
  locale: "es" | "en";
}

export interface GuidedAnswer {
  questionId: string;
  kind: QuestionKind;
  selected: string[];
  labels: string[];
  other?: string;
  skipped?: boolean;
}

export function validateQuestion(question: GuidedQuestion): string | null {
  if (!question.questionId.trim() || !question.question.trim()) return "missing_question";
  if (question.options.length < 2 || question.options.length > 8) return "invalid_option_count";
  if (new Set(question.options.map((option) => option.id)).size !== question.options.length) {
    return "duplicate_option";
  }
  if (question.options.some((option) => !option.id.trim() || !option.label.trim())) {
    return "invalid_option";
  }

  const recommended = question.options.filter((option) => option.recommended);
  if (recommended.length > 1) return "multiple_recommendations";
  if (recommended.length === 1 && !question.recommendationReason?.trim()) {
    return "recommendation_reason_required";
  }
  if (recommended.length === 1 && !recommended[0].downside?.trim()) {
    return "recommendation_downside_required";
  }
  if (question.recommendationReason?.trim() && recommended.length !== 1) {
    return "recommendation_option_required";
  }

  if (question.progress?.total !== undefined && question.progress.current > question.progress.total) {
    return "invalid_progress";
  }
  if (question.maxSelections !== undefined && question.maxSelections < question.minSelections) {
    return "invalid_selection_bounds";
  }

  const available = question.options.length + (question.otherAllowed && question.kind !== "rank" ? 1 : 0);
  if (question.minSelections > available || (question.maxSelections !== undefined && question.maxSelections > available)) {
    return "selection_bounds_exceed_choices";
  }
  if (question.kind === "single" && (question.minSelections !== 1 || question.maxSelections !== 1)) {
    return "single_requires_one";
  }
  if (question.kind === "multi" && question.maxSelections !== undefined && question.maxSelections < available && !question.selectionLimitReason?.trim()) {
    return "selection_limit_reason_required";
  }
  if (question.kind === "rank" && (question.otherAllowed || question.minSelections !== question.options.length || question.maxSelections !== question.options.length)) {
    return "rank_requires_all";
  }
  return null;
}

export function validateAnswer(question: GuidedQuestion, answer: GuidedAnswer): string | null {
  const questionError = validateQuestion(question);
  if (questionError) return `invalid_question:${questionError}`;
  const optionIds = new Set(question.options.map((option) => option.id));
  if (answer.questionId !== question.questionId || answer.kind !== question.kind) {
    return "answer_mismatch";
  }
  if (answer.skipped) {
    if (!question.allowSkip) return "skip_not_allowed";
    if (answer.selected.length || answer.labels.length || answer.other?.trim()) return "skip_must_be_empty";
    return null;
  }
  if (answer.selected.some((id) => !optionIds.has(id))) return "unknown_option";
  if (new Set(answer.selected).size !== answer.selected.length) return "duplicate_option";
  if (answer.labels.length !== answer.selected.length) return "labels_mismatch";
  if (answer.other?.trim() && !question.otherAllowed) return "other_not_allowed";
  if (answer.other && answer.other.length > 1000) return "other_too_long";

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
