import './message-box.css';

/** @constant {string} DEFAULT_TEXT Fallback message shown when no text is provided. */
const DEFAULT_TEXT = 'No blanks were defined for this exercise.';

/**
 * General purpose message box for communicating the empty state to users.
 */
export default class MessageBox {
  /** DOM element for the message box. */
  private dom: HTMLDivElement;

  /**
   * Create MessageBox instance.
   * @class
   * @param {object} [params] Parameters.
   * @param {string} [params.text] Message text, falls back to a default message.
   */
  constructor(params: { text?: string } = {}) {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-advanced-blanks-message-box');

    const message = document.createElement('p');
    message.classList.add('h5p-advanced-blanks-message-box-message');
    message.innerText = params.text || DEFAULT_TEXT;
    this.dom.append(message);
  }

  /**
   * Return DOM element for this view.
   * @returns {HTMLDivElement} DOM element.
   */
  getDOM(): HTMLDivElement {
    return this.dom;
  }
}
