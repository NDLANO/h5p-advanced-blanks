import { Correctness, Evaluation } from './evaluation';
import { Highlight } from './highlight';
import { Message } from './message';
import { ISettings } from '@services/settings';
import * as jsdiff from 'diff';

/** Represents possible answer for blank, such as correct or incorrect answer. */
export class Answer {
  /** Equivalent strings treated same, e.g. showing same feedback. */
  alternatives: string[];

  /** Message displayed when answer was entered by user. */
  message: Message;

  /** True if expected text for this answer is empty. */
  appliesAlways: boolean;

  /**
   * Create Answer instance.
   * @class
   * @param {string} answerText Expected answer. Alternatives separated by /.
   * @param {string} reaction Tooltip to display. Format: Tooltip Text;!!-1!! !!+1!!
   * @param {boolean} showHighlight Show highlight with message.
   * @param {number} highlight Highlight id shown with message.
   * @param {ISettings} settings Application settings.
   */
  constructor(
    answerText: string, reaction: string, showHighlight: boolean, highlight: number, private settings: ISettings
  ) {
    this.alternatives = answerText.split(/\//).map((s) => s.trim());
    this.message = new Message(reaction, showHighlight, highlight);
    if (answerText.trim() === '') {
      this.appliesAlways = true;
    }
    else {
      this.appliesAlways = false;
    }
  }

  /**
   * Look through message ids and store references to corresponding highlight objects.
   * @param {Highlight[]} highlightsBefore List of highlights before any changes.
   * @param {Highlight[]} highlightsAfter List of highlights after changes.
   */
  public linkHighlightIdToObject(highlightsBefore: Highlight[], highlightsAfter: Highlight[]): void {
    this.message.linkHighlight(highlightsBefore, highlightsAfter);
  }
  /** Turn on highlights set by content author for this answer. */
  public activateHighlight() {
    if (this.message.highlightedElement) {
      this.message.highlightedElement.isHighlighted = true;
    }
  }

  /**
   * Clean string by trimming and collapsing whitespace.
   * @param {string} text Text to clean.
   * @returns {string} Cleaned text.
   */
  private cleanString(text: string): string {
    text = text.trim();

    return text.replace(/\s{2,}/g, ' ');
  }

  /**
   * Count character change operations needed to turn one string into another.
   * @param {jsdiff.Change[]} diff As returned by jsdiff.
   * @returns {number} Count of changes (replace, add, delete) needed to change one string to another.
   */
  private getChangesCountFromDiff(diff: jsdiff.Change[]): number {
    let totalChangesCount = 0;
    let lastType = '';
    let lastCount = 0;

    for (const element of diff) {
      if (element.removed) {
        totalChangesCount += element.value.length;
        lastType = 'removed';
      }
      else if (element.added) {
        if (lastType === 'removed') {
          if (lastCount < element.value.length) {
            totalChangesCount += element.value.length - lastCount;
          }
        }
        else {
          totalChangesCount += element.value.length;
        }
        lastType = 'added';
      }
      else {
        lastType = 'same';
      }
      lastCount = element.value.length;
    }

    return totalChangesCount;
  }

  /**
   * Return how many characters can be wrong to still count as a spelling mistake.
   * @param {string} text Text to measure against.
   * @returns {number} Number of acceptable spelling mistakes, or 0 if disabled.
   */
  private getAcceptableSpellingMistakes(text: string): number {
    let acceptableTypoCount: number;
    // TODO: consider removal
    if (this.settings.warnSpellingErrors || this.settings.acceptSpellingErrors) {
      acceptableTypoCount = Math.floor(text.length / 10) + 1;
    }
    else {
      acceptableTypoCount = 0;
    }

    return acceptableTypoCount;
  }

  /**
   * Check if text entered by user in attempt matches answer.
   * @param {string} attempt Text entered by user.
   * @returns {Evaluation} Indicates if entered text is matched by answer.
   */
  public evaluateAttempt(attempt: string): Evaluation {
    const cleanedAttempt = this.cleanString(attempt);
    const evaluation = new Evaluation(this);

    for (const alternative of this.alternatives) {
      const cleanedAlternative = this.cleanString(alternative);

      const diff = jsdiff.diffChars(cleanedAlternative, cleanedAttempt,
        { ignoreCase: !this.settings.caseSensitive });
      const changeCount = this.getChangesCountFromDiff(diff);

      if (changeCount === 0) {
        evaluation.usedAlternative = cleanedAlternative;
        evaluation.correctness = Correctness.ExactMatch;
        return evaluation;
      }

      if (changeCount <= this.getAcceptableSpellingMistakes(alternative)
        && (evaluation.characterDifferenceCount === 0 || changeCount < evaluation.characterDifferenceCount)) {
        evaluation.usedAlternative = cleanedAlternative;
        evaluation.correctness = Correctness.CloseMatch;
        evaluation.characterDifferenceCount = changeCount;
      }
    }

    return evaluation;
  }
}
