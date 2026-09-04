import type { Answer } from './answer';

export enum Correctness {
  ExactMatch, /** Exact match between attempt and answer. */
  CloseMatch, /** Attempt is close enough to match. */
  NoMatch /** No match between attempt and answer. */
}

/** Tracks evaluation results for an answer attempt. */
export class Evaluation {
  /** Correctness level of match. */
  public correctness: Correctness;

  /** Number of character differences. */
  public characterDifferenceCount: number;

  /** Alternative answer that matched. */
  public usedAlternative: string;

  /**
   * Create Evaluation instance.
   * @class
   * @param {Answer} usedAnswer Answer used in evaluation.
   */
  constructor(public usedAnswer: Answer) {
    this.correctness = Correctness.NoMatch;
    this.characterDifferenceCount = 0;
    this.usedAlternative = '';
  }
}
