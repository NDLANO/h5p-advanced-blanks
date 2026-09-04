import { BlankLoader } from '../content-loaders/blank-loader';
import { Blank } from '../models/blank';
import { Snippet } from '../models/snippet';
import { ISettings } from '../services/settings';
import { H5PLocalization } from './localization';
import { Unwrapper } from '../helpers/unwrapper';

/**
 * Interface for accessing cloze content data.
 */
export interface IDataRepository {
  /** Return list of blanks for cloze. */
  getBlanks(): Blank[];

  /** Return cloze text as HTML markup. */
  getClozeText(): string;

  /** Return media information for cloze. */
  getMedia(): any;

  /** Return task description text. */
  getTaskDescription(): string;

  /** Return list of snippets for cloze. */
  getSnippets(): Snippet[];
}

/**
 * Wrap h5p config object and provide access to content.
 */
export class H5PDataRepository implements IDataRepository {
  /**
   * Create H5PDataRepository instance.
   * @class
   * @param {any} h5pConfigData H5P configuration data.
   * @param {ISettings} settings Application settings.
   * @param {H5PLocalization} localization Localization service.
   * @param {JQueryStatic} jquery jQuery instance.
   * @param {Unwrapper} unwrapper Unwrapper helper.
   */
  constructor(private h5pConfigData: any, private settings: ISettings,
    private localization: H5PLocalization, private jquery: JQueryStatic,
    private unwrapper: Unwrapper) {

  }

  /**
   * Return blank text of cloze (as HTML markup).
   * @returns {string} Cloze text as HTML markup.
   */
  getClozeText(): string {
    return this.h5pConfigData.content.blanksText;
  }

  /**
   * Return media information for cloze.
   * @returns {any} Media type of cloze.
   */
  getMedia(): any {
    return this.h5pConfigData.media.type;
  }

  /**
   * Return task description text.
   * @returns {string} Task description text.
   */
  getTaskDescription(): string {
    return this.h5pConfigData.content.task;
  }

  /**
   * Return list of blanks for cloze.
   * @returns {Blank[]} List of configured blank instances.
   */
  getBlanks(): Blank[] {
    const blanks: Blank[] = [];

    if (!this.h5pConfigData.content.blanksList) {
      return blanks;
    }

    for (let i = 0; i < this.h5pConfigData.content.blanksList.length; i++) {
      const h5pBlank = this.h5pConfigData.content.blanksList[i];

      const correctAnswer = h5pBlank.filter((alternative) => alternative.isCorrect).shift() || {};
      if (correctAnswer.text === '' || correctAnswer.text === undefined) {
        continue;
      }

      const defaultOrder = h5pBlank.map((alternative) => alternative.text);
      const incorrectAnswers = h5pBlank
        .filter((alternative) => !alternative.isCorrect)
        .map((answer) => ({
          incorrectAnswerText: answer.text,
          incorrectAnswerFeedback: answer.optionsIncorrect.incorrectAnswerFeedback,
          showHighlight: answer.optionsIncorrect.showHighlight,
          highlight: answer.optionsIncorrect.highlight
        }));

      const blank = BlankLoader.instance.createBlank('cloze-' + H5P.createUUID() + '-' + i,
        correctAnswer.text, correctAnswer.hint, incorrectAnswers, defaultOrder);

      blank.finishInitialization();
      blanks.push(blank);
    }

    return blanks;
  }

  /**
   * Return list of snippets for cloze.
   * @returns {Snippet[]} List of configured snippet instances.
   */
  getSnippets(): Snippet[] {
    const snippets: Snippet[] = [];

    if (!this.h5pConfigData.snippets) {
      return snippets;
    }

    for (let i = 0; i < this.h5pConfigData.snippets.length; i++) {
      const raw_snippet = this.h5pConfigData.snippets[i];
      const snippet = new Snippet(raw_snippet.snippetName, this.unwrapper.unwrap(raw_snippet.snippetText));
      snippets.push(snippet);
    }

    return snippets;
  }
}
