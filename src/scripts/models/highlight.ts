import { ClozeElement, ClozeElementType } from './cloze-element';

/**
 * Represent highlight in cloze.
 */
export class Highlight extends ClozeElement {
  /** Text content of highlight. */
  text: string;

  /** True if highlight is currently active. */
  isHighlighted: boolean;

  /** Unique identifier for this highlight. */
  id: string;

  /**
   * Create Highlight instance.
   * @class
   * @param {string} text Highlight text content.
   * @param {string} id Unique identifier.
   */
  constructor(text: string, id: string) {
    super();
    this.type = ClozeElementType.Highlight;
    this.text = text;
    this.id = id;
    this.isHighlighted = false;
  }
}
