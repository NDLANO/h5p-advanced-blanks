/** Message type enumeration for feedback states. */
export enum MessageType {
  Error,
  Correct,
  Retry,
  ShowSolution,
  None
}

/** Cloze mode enumeration for input type. */
export enum ClozeType {
  Type,
  Select
}

/** Select alternatives enumeration for source of choices. */
export enum SelectAlternatives {
  Alternatives,
  All
}
