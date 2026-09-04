import { Blank } from '@models/blank';

/**
 * Manage speech bubble message display for blanks.
 */
export class MessageService {
  /** Reference to current speech bubble. */
  private speechBubble: any;

  /** Blank currently associated with message. */
  private associatedBlank: Blank;

  /**
   * Create MessageService instance.
   * @class
   * @param {JQueryStatic} jQuery jQuery instance.
   */
  constructor(private jQuery: JQueryStatic) {
  }

  /**
   * Show speech bubble message for blank.
   * @param {string} elementId ID of target element.
   * @param {string} message Message text to display.
   * @param {Blank} blank Blank to associate with message.
   */
  public show(elementId: string, message: string, blank: Blank): void {
    const elements = this.jQuery('#' + elementId);

    if (elements.length > 0) {
      this.speechBubble = new H5P.JoubelSpeechBubble(elements, message);
      this.associatedBlank = blank;
    }
  }

  /**
   * Hide active speech bubble.
   */
  public hide(): void {
    if (this.speechBubble) {
      try {
        this.speechBubble.remove();
      }
      catch {
        // ignore errors when removing speech bubble
      }
    }
    this.speechBubble = undefined;
    this.associatedBlank = undefined;
  }

  /**
   * Check if blank is currently associated with active message.
   * @param {Blank} blank Blank to check.
   * @returns {boolean} True if blank is active.
   */
  public isActive(blank: Blank): boolean {
    return this.associatedBlank === blank;
  }
}
