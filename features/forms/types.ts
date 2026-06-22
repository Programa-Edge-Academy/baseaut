/**
 * Supported question types for dynamic form rendering.
 */
export type QuestionType =
  | "open"
  | "yes_no"
  | "linear_scale"
  | "dropdown"
  | "choice_list"
  | "matrix";
/**
 * Subtypes for yes/no questions with conditional follow-ups.
 */
export type YesNoSubtype =
  | "standard"
  | "conditional_positive"
  | "conditional_negative";

/**
 * Shared fields for all question definitions.
 */
export interface BaseQuestion {
  id: string;
  title: string;
  type: QuestionType;
  helpText?: string;
  allowObservation?: boolean;
}

/**
 * Open-ended text question.
 */
export interface OpenQuestion extends BaseQuestion {
  type: "open";
  /** Quando true, aceita apenas números (single-line + teclado numérico). */
  numeric?: boolean;
}

/**
 * Yes/no question with optional conditional sub-question.
 */
export interface YesNoQuestion extends BaseQuestion {
  type: "yes_no";
  subtype: YesNoSubtype;
  subQuestion?: FormQuestionProps;
}

/**
 * Linear scale question with numeric bounds.
 */
export interface LinearScaleQuestion extends BaseQuestion {
  type: "linear_scale";
  min: number;
  max: number;
  step?: number;
}

/**
 * Dropdown question with a fixed set of options.
 */
export interface DropdownQuestion extends BaseQuestion {
  type: "dropdown";
  options: string[];
  allowOther?: boolean;
}

/**
 * Choice list question with optional multi-select and "other" input.
 */
export interface ChoiceListQuestion extends BaseQuestion {
  type: "choice_list";
  options: string[];
  multiple?: boolean;
  allowOther?: boolean;
}

/**
 * Matrix question with row and column labels.
 */
export interface MatrixQuestion extends BaseQuestion {
  type: "matrix";
  rows: string[];
  columns: string[];
}

/**
 * Union type for all form question variants.
 */
export type FormQuestionProps =
  | OpenQuestion
  | YesNoQuestion
  | LinearScaleQuestion
  | DropdownQuestion
  | ChoiceListQuestion
  | MatrixQuestion;
