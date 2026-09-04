import { Highlight } from './highlight';

/**
 * Represent message that content author has specified to be reaction to user's answer.
 */
export class Message {
  /** Highlight element associated with this message. */
  highlightedElement: Highlight;

  /**
   * Create Message instance.
   * @class
   * @param {string} text Message text content.
   * @param {boolean} showHighlight Whether to show a highlight.
   * @param {number} relativeHighlightPosition Position index for highlight lookup.
   */
  constructor(public text: string, showHighlight: boolean, private relativeHighlightPosition: number) {
    if (!showHighlight) {
      this.relativeHighlightPosition = undefined;
    }
  }

  /**
   * Link this message to highlight based on position.
   * @param {Highlight[]} highlightsBefore Highlights before the target blank.
   * @param {Highlight[]} highlightsAfter Highlights after the target blank.
   */
  linkHighlight = (highlightsBefore: Highlight[], highlightsAfter: Highlight[]): void => {
    if (!this.relativeHighlightPosition) {
      return;
    }

    if (this.relativeHighlightPosition < 0 && (0 - this.relativeHighlightPosition - 1) < highlightsBefore.length) {
      this.highlightedElement = highlightsBefore[0 - this.relativeHighlightPosition - 1];
    }
    else if (this.relativeHighlightPosition > 0 && (this.relativeHighlightPosition - 1 < highlightsAfter.length)) {
      this.highlightedElement = highlightsAfter[this.relativeHighlightPosition - 1];
    }
  };
}
