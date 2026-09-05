import './highlight-view.css';
import { Highlight } from '@models/highlight';

/**
 * View layer for rendering highlight elements.
 */
export default class HighlightView {
  /** DOM span element for this highlight. */
  private dom: HTMLSpanElement;

  /**
   * Create HighlightView instance.
   * @class
   * @param {Highlight} object Highlight model to render.
   */
  constructor(object: Highlight) {
    this.dom = document.createElement('span');
    this.set(object);
  }

  /**
   * Return DOM element for this view.
   * @returns {HTMLSpanElement} DOM element.
   */
  getDOM(): HTMLSpanElement {
    return this.dom;
  }

  /**
   * Update view with current highlight state.
   * @param {Highlight} object Highlight model with updated state.
   */
  set(object: Highlight): void {
    this.dom.id = object.id;
    this.dom.classList.toggle('highlighted', object.isHighlighted ?? false);
    this.dom.textContent = object.text || '';
  }
}
