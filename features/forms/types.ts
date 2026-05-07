export type QuestionType = 'open' | 'yes_no' | 'linear_scale' | 'dropdown' | 'choice_list' | 'matrix';
export type YesNoSubtype = 'standard' | 'conditional_positive' | 'conditional_negative';

export interface BaseQuestion {
  id: string;
  title: string;
  type: QuestionType;
}

export interface OpenQuestion extends BaseQuestion {
  type: 'open';
}

export interface YesNoQuestion extends BaseQuestion {
  type: 'yes_no';
  subtype: YesNoSubtype;
  subQuestion?: FormQuestionProps;
}

export interface LinearScaleQuestion extends BaseQuestion {
  type: 'linear_scale';
  min: number;
  max: number;
}

export interface DropdownQuestion extends BaseQuestion {
  type: 'dropdown';
  options: string[];
  allowOther?: boolean;
}

export interface ChoiceListQuestion extends BaseQuestion {
  type: 'choice_list';
  options: string[];
  multiple?: boolean;
  allowOther?: boolean;
}

export interface MatrixQuestion extends BaseQuestion {
  type: 'matrix';
  rows: string[];
  columns: string[];
}

export type FormQuestionProps = 
  | OpenQuestion 
  | YesNoQuestion 
  | LinearScaleQuestion 
  | DropdownQuestion 
  | ChoiceListQuestion 
  | MatrixQuestion;