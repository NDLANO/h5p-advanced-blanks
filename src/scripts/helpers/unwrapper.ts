/**
 * Clean HTML strings by removing outermost tag.
 */
export class Unwrapper {
  /**
   * Create Unwrapper instance.
   * @class
   * @param {JQueryStatic} jquery jQuery instance.
   */
  public constructor(private jquery: JQueryStatic) {
  }

  /**
   * Remove outermost HTML tag when only one tag exists.
   * Examples:  "<p>my text</p>"" becomes "my text"
   *            "<p>text 1</p><p>text 2</p2>" stays
   * @param {string} html HTML string.
   * @returns {string} Cleaned HTML string.
   */
  public unwrap(html: string): string {
    const parsed = this.jquery(html);
    if (parsed.length !== 1) {
      return html;
    }

    const unwrapped = parsed.unwrap().html();

    return unwrapped;
  }
}
