/** Message type enumeration for feedback states. */
export enum MessageType {
  Error,
  Correct,
  Retry,
  ShowSolution,
  None
}

/** Separator for options selected in multiple selection blanks. */
export const MULTIPLE_SELECTION_SEPARATOR = '[|]';

/** Cloze mode enumeration for input type. */
export enum ClozeType {
  Type,
  Select,
  Number,
  SelectMultiple
}

/** Select alternatives enumeration for source of choices. */
export enum SelectAlternatives {
  Alternatives,
  All
}
