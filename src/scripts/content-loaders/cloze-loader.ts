import { BlankLoader } from '@content-loaders/blank-loader';
import { ClozeElement, ClozeElementType } from '@models/cloze-element';
import { Blank } from '@models/blank';
import { Highlight } from '@models/highlight';
import { Cloze } from '@models/cloze';

/**
 * Load and configure cloze instances from content data.
 */
export class ClozeLoader {
  /** @constant {string} normalizedBlankMarker Marker used to normalize blank markings in HTML. */
  private static normalizedBlankMarker = '___';

  /**
   * Create Cloze instance from HTML and blanks.
   * @param {string} html HTML string with blank and highlight markup.
   * @param {Blank[]} blanks Blanks as entered by content author.
   * @returns {Cloze} Configured Cloze instance.
   */
  public static createCloze(html: string, blanks: Blank[]): Cloze {
    html = ClozeLoader.normalizeBlankMarkings(html);

    const conversionResult = ClozeLoader.convertMarkupToSpans(html, blanks);
    html = conversionResult.html;
    const orderedAllElementsList = conversionResult.orderedAllElementsList;
    const highlightInstances = conversionResult.highlightInstances;
    const blanksInstances = conversionResult.blanksInstances;

    ClozeLoader.linkHighlightsObjects(orderedAllElementsList, highlightInstances, blanksInstances);

    const cloze = new Cloze();
    cloze.html = html;
    cloze.blanks = blanksInstances;
    cloze.highlights = highlightInstances;

    return cloze;
  }

  /**
   * Convert highlight and blank markup into span elements.
   * @param {string} html HTML with markup to convert.
   * @param {Blank[]} blanks Blanks to match against.
   * @returns {object} Result containing html, orderedAllElementsList, highlightInstances, and blanksInstances.
   */
  private static convertMarkupToSpans(html: string, blanks: Blank[]): {
    html: string, orderedAllElementsList: ClozeElement[], highlightInstances: Highlight[], blanksInstances: Blank[]
  } {
    const orderedAllElementsList: ClozeElement[] = [];
    const highlightInstances: Highlight[] = [];
    const blanksInstances: Blank[] = [];

    const exclamationMarkRegExp = /!!(.{1,40}?)!!/i;
    let highlightCounter = 0;
    let blankCounter = 0;

    let nextHighlightMatch: RegExpMatchArray | null;
    let nextBlankIndex : number;
    do {
      nextHighlightMatch = html.match(exclamationMarkRegExp);
      nextBlankIndex = html.indexOf(ClozeLoader.normalizedBlankMarker);

      if (nextHighlightMatch && ((nextHighlightMatch.index < nextBlankIndex) || (nextBlankIndex < 0))) {
        const highlight = new Highlight(nextHighlightMatch[1], `highlight_${highlightCounter}`);
        highlightInstances.push(highlight);
        orderedAllElementsList.push(highlight);
        html = html.replace(exclamationMarkRegExp, `<span id='container_highlight_${highlightCounter}'></span>`);
        highlightCounter++;
      }
      else if (nextBlankIndex >= 0) {
        if (blankCounter >= blanks.length) {
          html = html.replace(ClozeLoader.normalizedBlankMarker, '<span></span>');
        }
        else {
          const blank = blanks[blankCounter];
          blanksInstances.push(blank);
          orderedAllElementsList.push(blank);
          html = html.replace(ClozeLoader.normalizedBlankMarker, `<span id='container_${blank.id}'></span>`);
          blankCounter++;
        }
      }
    }
    while (nextHighlightMatch || (nextBlankIndex >= 0));

    return {
      html: html,
      orderedAllElementsList: orderedAllElementsList,
      highlightInstances: highlightInstances,
      blanksInstances: blanksInstances
    };
  }

  /**
   * Replace all marked blank instances with normalized marker.
   * @param {string} html HTML string to normalize.
   * @returns {string} Normalized HTML string.
   */
  private static normalizeBlankMarkings(html: string): string {
    const underlineBlankRegEx = /_{3,}/g;
    html = html.replace(underlineBlankRegEx, ClozeLoader.normalizedBlankMarker);

    return html;
  }

  /**
   * Link highlight objects to blanks based on document order.
   * @param {ClozeElement[]} orderedAllElementsList All elements in document order.
   * @param {Highlight[]} highlightInstances Highlight instances.
   * @param {Blank[]} blanksInstances Blank instances.
   */
  private static linkHighlightsObjects(
    orderedAllElementsList: ClozeElement[],
    highlightInstances: Highlight[],
    blanksInstances: Blank[]
  ): void {
    for (const blank of blanksInstances) {
      const nextBlankIndexInArray = orderedAllElementsList.indexOf(blank);
      const highlightsBeforeBlank = orderedAllElementsList
        .slice(0, nextBlankIndexInArray)
        .filter((e) => e.type === ClozeElementType.Highlight)
        .map((e) => e as Highlight)
        .reverse();
      const highlightsAfterBlank = orderedAllElementsList
        .slice(nextBlankIndexInArray + 1)
        .filter((e) => e.type === ClozeElementType.Highlight)
        .map((e) => e as Highlight);
      BlankLoader.instance.linkHighlightIdToObject(blank, highlightsBeforeBlank, highlightsAfterBlank);
    }
  }
}
