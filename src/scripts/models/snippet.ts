/**
 * Represent snippet, text block inserted at marked positions in feedback texts and hints.
 */
export class Snippet {
  /** Name used as reference marker in feedback text. */
  name: string;

  /** Text content (HTML). */
  text: string;

  /**
   * Create Snippet instance.
   * @class
   * @param {string} name Name used when referenced in feedback text (without marker @).
   * @param {string} text Snippet content (html).
   */
  constructor(name: string, text: string) {
    this.name = name;
    this.text = text;
  }
}
