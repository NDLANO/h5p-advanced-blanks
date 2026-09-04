import { MessageService } from '../services/message-service';
import { Highlight } from '../models/highlight';
import { Answer } from '../models/answer';
import { Blank } from '../models/blank';
import { H5PLocalization } from '../services/localization';
import { ISettings } from '../services/settings';
import { Message } from '../models/message';
import { Snippet } from '../models/snippet';

/**
 * Load and configure blank instances from content data.
 */
export class BlankLoader {

  /**
   * @class
   * @param {ISettings} settings Application settings.
   * @param {H5PLocalization} localization Localization service.
   * @param {JQueryStatic} jquery jQuery instance.
   * @param {MessageService} messageService Message service.
   */
  private constructor(
    private settings: ISettings,
    private localization: H5PLocalization,
    private jquery: JQueryStatic,
    private messageService: MessageService
  ) {}

  /**
   * @constant BlankLoader singleton instance.
   */
  private static _instance: BlankLoader;

  /**
   * Create BlankLoader singleton instance.
   * @param {ISettings} settings Application settings.
   * @param {H5PLocalization} localization Localization service.
   * @param {JQueryStatic} jquery jQuery instance.
   * @param {MessageService} messageService Message service.
   * @returns {BlankLoader} BlankLoader singleton instance.
   */
  public static initialize(
    settings: ISettings, localization: H5PLocalization, jquery: JQueryStatic, messageService: MessageService
  ): BlankLoader {
    this._instance = new BlankLoader(settings, localization, jquery, messageService);

    return this._instance;
  }

  /**
   * Return BlankLoader singleton instance.
   * @returns {BlankLoader} BlankLoader singleton instance.
   */
  public static get instance(): BlankLoader {
    if (this._instance) {
      return this._instance;
    }

    throw 'BlankLoader must be initialized before use.';
  }

  /**
   * Decode HTML entities in string.
   * @param {string} html HTML string to decode.
   * @returns {string} Decoded string.
   */
  private decodeHtml(html: string): string {
    const elem = document.createElement('textarea');
    elem.innerHTML = html;

    return elem.value;
  }

  /**
   * Create and configure Blank instance from content data.
   * @param {string} id Blank identifier.
   * @param {string} correctText Correct answer text.
   * @param {string} hintText Hint text.
   * @param {any[]} incorrectAnswers List of incorrect answers.
   * @param {string[]} defaultOrder Default choice order.
   * @returns {Blank} Configured Blank instance.
   */
  public createBlank(
    id: string, correctText: string, hintText: string, incorrectAnswers: any[], defaultOrder: string[]
  ): Blank {
    const blank = new Blank(this.settings, this.localization, this.jquery, this.messageService, id);
    if (correctText) {
      correctText = this.decodeHtml(correctText);
      blank.addCorrectAnswer(new Answer(correctText, '', false, 0, this.settings));
    }
    blank.setHint(new Message(hintText ? hintText : '', false, 0));

    if (incorrectAnswers) {
      for (const h5pIncorrectAnswer of incorrectAnswers) {
        blank.addIncorrectAnswer(
          this.decodeHtml(h5pIncorrectAnswer.incorrectAnswerText),
          h5pIncorrectAnswer.incorrectAnswerFeedback,
          h5pIncorrectAnswer.showHighlight,
          h5pIncorrectAnswer.highlight
        );
      }
    }

    if (defaultOrder) {
      blank.setDefaultOrder(defaultOrder.map((text) => this.decodeHtml(text)));
    }

    return blank;
  }

  /**
   * Replace snippet placeholders in answer and hint text.
   * @param {Blank} blank Blank containing answers to update.
   * @param {Snippet[]} snippets List of snippets for replacement.
   */
  public replaceSnippets(blank: Blank, snippets: Snippet[]): void {
    blank.correctAnswers.concat(blank.incorrectAnswers)
      .forEach((answer) => answer.message.text = this.getStringWithSnippets(answer.message.text, snippets));
    blank.hint.text = this.getStringWithSnippets(blank.hint.text, snippets);
  }

  /**
   * Replace snippet placeholders in text with snippet values.
   * @param {string} text Text containing snippet placeholders.
   * @param {Snippet[]} snippets List of snippets for replacement.
   * @returns {string} Text with placeholders replaced.
   */
  private getStringWithSnippets(text: string, snippets: Snippet[]): string {
    if (!text || text === undefined) {
      return '';
    }

    if (!snippets) {
      return text;
    }

    for (const snippet of snippets) {
      if (snippet.name === undefined || snippet.name === '' || snippet.text === undefined || snippet.text === '') {
        continue;
      }
      text = text.replace('@' + snippet.name, snippet.text);
    }

    return text;
  }

  /**
   * Link highlight objects to answers in correct and incorrect answer lists.
   * @param {Blank} blank Blank whose highlights to link.
   * @param {Highlight[]} highlightsBefore Highlights before blank.
   * @param {Highlight[]} highlightsAfter Highlights after blank.
   */
  public linkHighlightIdToObject(blank: Blank, highlightsBefore: Highlight[], highlightsAfter: Highlight[]): void {
    for (const answer of blank.correctAnswers) {
      answer.linkHighlightIdToObject(highlightsBefore, highlightsAfter);
    }

    for (const answer of blank.incorrectAnswers) {
      answer.linkHighlightIdToObject(highlightsBefore, highlightsAfter);
    }

    blank.hint.linkHighlight(highlightsBefore, highlightsAfter);
  }
}
