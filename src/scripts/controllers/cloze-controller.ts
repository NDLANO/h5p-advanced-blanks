import { MessageService } from '../services/message-service';
import { BlankLoader } from '../content-loaders/blank-loader';
import { ClozeLoader } from '../content-loaders/cloze-loader';
import { Cloze } from '../models/cloze';
import { IDataRepository } from '../services/data-repository';
import { ISettings } from '../services/settings';
import { H5PLocalization } from '../services/localization';
import { ClozeType, SelectAlternatives } from '../models/enums';
import { Highlight } from '../models/highlight';
import { Blank } from '../models/blank';
import { Correctness } from '../models/answer';

import BlankView from '../views/blank-view';
import HighlightView from '../views/highlight-view';

interface ScoreChanged {
  (score: number, maxScore: number): void;
}

interface AutoChecked {
  (): void;
}

interface Solved {
  (): void;
}

interface Typed {
  (): void;
}

interface TextChanged {
  () : void;
}

/**
 * Control cloze interaction logic and coordinate between model and views.
 */
export class ClozeController {
  /** jQuery instance for DOM queries. */
  private jquery: JQuery;

  /** Cloze model instance. */
  private cloze: Cloze;

  /** True if this is a select-mode cloze. */
  private isSelectCloze: boolean;

  /** Callback invoked when score changes. */
  public onScoreChanged: ScoreChanged;

  /** Callback invoked when auto-check occurs. */
  public onAutoChecked: AutoChecked;

  /** Callback invoked when cloze is solved. */
  public onSolved: Solved;

  /** Callback invoked when text is typed. */
  public onTyped: Typed;

  /** Callback invoked when text changes. */
  public onTextChanged: TextChanged;

  /** Map of blank views by ID. */
  private blankViews: { [id: string]: BlankView } = {};

  /** Map of highlight views by ID. */
  private highlightsViews: { [id: string]: HighlightView } = {};

  /**
   * Return maximum possible score (number of blanks).
   * @returns {number} Maximum score.
   */
  public get maxScore(): number {
    return this.cloze.blanks.length;
  }

  /**
   * Detect whether any blank has more than one solution.
   * @returns {boolean} True if at least one blank has multiple solutions.
   */
  public get hasAlternatives(): boolean {
    return this.cloze.blanks.some((b) => b.correctAnswers[0].alternatives.length > 1);
  }

  /**
   * Calculate current score from all blank evaluations.
   * @returns {number} Current score.
   */
  public get currentScore(): number {
    const score = this.cloze.blanks.reduce((score, b) => {
      const notShowingSolution = !b.isShowingSolution;
      const correctAnswerGiven = b.correctAnswers[0].alternatives.indexOf(b.enteredText || '') !== -1;

      const closeCorrectMatches = b.correctAnswers
        .map((answer) => answer.evaluateAttempt(b.enteredText))
        .filter((evaluation) => evaluation.correctness === Correctness.CloseMatch);
      const similarAnswerGiven = this.settings.acceptSpellingErrors && closeCorrectMatches.length > 0;

      return score + ((notShowingSolution && (correctAnswerGiven || similarAnswerGiven)) ? 1 : 0);
    }, 0);

    return Math.max(0, score);
  }

  /**
   * Check whether all blanks have been entered (error, correct, or retry state).
   * @returns {boolean} True if all blanks have been entered.
   */
  public get allBlanksEntered(): boolean {
    if (this.cloze) {
      return this.cloze.blanks.every((blank) => blank.isError || blank.isCorrect || blank.isRetry);
    }

    return false;
  }

  /**
   * Check whether cloze is fully solved.
   * @returns {boolean} True if the cloze is solved.
   */
  public get isSolved(): boolean {
    return this.cloze.isSolved;
  }

  /**
   * Check whether any blank has been filled out.
   * @returns {boolean} True if at least one blank has content.
   */
  public get isFilledOut(): boolean {
    if (!this.cloze || this.cloze.blanks.length === 0) {
      return true;
    }

    return this.cloze.blanks.some((b) => b.enteredText !== '');
  }

  /**
   * Check whether all blanks have been filled out.
   * @returns {boolean} True if all blanks have content.
   */
  public get isFullyFilledOut(): boolean {
    if (!this.cloze || this.cloze.blanks.length === 0) {
      return true;
    }

    return this.cloze.blanks.every((b) => b.enteredText !== '');
  }

  /**
   * Create ClozeController instance.
   * @class
   * @param {IDataRepository} repository Data repository.
   * @param {ISettings} settings Application settings.
   * @param {H5PLocalization} localization Localization service.
   * @param {MessageService} MessageService Message service.
   */
  constructor(
    private repository: IDataRepository,
    private settings: ISettings,
    private localization: H5PLocalization,
    private MessageService: MessageService
  ) {}

  /**
   * Set up cloze model (blanks, snippets, cloze instance).
   */
  public setupModel(): void {
    this.isSelectCloze = this.settings.clozeType === ClozeType.Select ? true : false;

    const blanks = this.repository.getBlanks();

    if (this.isSelectCloze && this.settings.selectAlternatives === SelectAlternatives.All) {
      for (const blank of blanks) {
        const otherBlanks = blanks.filter((v) => v !== blank);
        blank.loadChoicesFromOtherBlanks(otherBlanks);
      }
    }

    const snippets = this.repository.getSnippets();
    blanks.forEach((blank) => BlankLoader.instance.replaceSnippets(blank, snippets));

    this.cloze = ClozeLoader.createCloze(this.repository.getClozeText(), blanks);
  }

  /**
   * Render cloze into DOM and creates views. Requires setupModel() to have been called first.
   * @param {HTMLElement} root Root element to render into.
   * @param {JQuery} jquery jQuery instance.
   */
  public render(root: HTMLElement, jquery: JQuery): void {
    this.jquery = jquery;

    const containers = this.createAndAddContainers(root);
    containers.cloze.innerHTML = this.cloze.html;
    this.createViews();
  }

  /**
   * Check all blanks and evaluate answers.
   */
  checkAll = (): void => {
    this.cloze.hideAllHighlights();
    for (const blank of this.cloze.blanks) {
      if ((!blank.isCorrect) && blank.enteredText !== '') {
        blank.evaluateAttempt(true, true);
      }
      blank.isDisabled = true;
    }
    this.refreshCloze();
    this.checkAndNotifyCompleteness();
  };

  /**
   * Handle text typed event for blank.
   * @param {Event} event Keyboard event.
   * @param {Blank} blank Blank that received input.
   */
  textTyped = (event: Event, blank: Blank): void => {
    blank.onTyped();
    if (this.onTyped) {
      this.onTyped();
    }

    this.refreshCloze();
  };

  /**
   * Handle focus event for blank.
   * @param {Event} event Focus event.
   * @param {Blank} blank Blank that received focus.
   */
  focus = (event: Event, blank: Blank): void => {
    blank.onFocused();
    this.refreshCloze();
  };

  /**
   * Handle feedback display event for blank.
   * @param {Event} event Click event.
   * @param {Blank} blank Blank to display feedback for.
   */
  displayFeedback = (event: Event, blank: Blank): void => {
    blank.onDisplayFeedback();
    this.refreshCloze();
  };

  /**
   * Handle hint display event for blank.
   * @param {Event} event Click event.
   * @param {Blank} blank Blank to show hint for.
   */
  showHint = (event: Event, blank: Blank): void => {
    this.cloze.hideAllHighlights();
    blank.showHint();
    this.refreshCloze();
  };

  /**
   * Handle request to close tooltip for blank.
   * @param {Event} event Keyboard event.
   * @param {Blank} blank Blank to close tooltip for.
   */
  requestCloseTooltip = (event: Event, blank: Blank): void => {
    blank.removeTooltip();
    this.refreshCloze();
    this.jquery.find('#' + blank.id).focus();
  };

  /**
   * Handle blank check event triggered by user action.
   * @param {Event} event Event that triggered the check.
   * @param {Blank} blank Blank to check.
   * @param {string} cause Event cause (blur, change, enter).
   */
  checkBlank = (event: Event, blank: Blank, cause: string): void => {
    if ((cause === 'blur' || cause === 'change')) {
      blank.lostFocus();
    }

    if (cause === 'change' && this.onTyped) {
      this.onTyped();
    }

    if (this.settings.autoCheck) {
      if (!blank.enteredText || blank.enteredText === '') {
        return;
      }

      this.cloze.hideAllHighlights();
      blank.evaluateAttempt(false);
      this.checkAndNotifyCompleteness();
      this.refreshCloze();
      this.onAutoChecked();
    }

    if ((cause === 'enter')
      && ((this.settings.autoCheck && blank.isCorrect && !this.isSolved)
        || !this.settings.autoCheck)) {
      let index = this.cloze.blanks.indexOf(blank);

      let nextId: string;
      while (index < this.cloze.blanks.length - 1 && !nextId) {
        index++;
        if (!this.cloze.blanks[index].isCorrect) {
          nextId = this.cloze.blanks[index].id;
        }
      }

      if (nextId) {
        this.jquery.find('#' + nextId).focus();
      }
    }
  };

  /**
   * Reset cloze to initial state.
   */
  reset = (): void => {
    this.cloze.reset();
    this.refreshCloze();
  };

  /**
   * Show solutions for all blanks.
   */
  showSolutions = (): void => {
    this.cloze.showSolutions();
    this.refreshCloze();
  };

  /**
   * Create and adds cloze container element to DOM.
   * @param {HTMLElement} addTo Element to append container to.
   * @returns {object} Object containing cloze div element.
   */
  private createAndAddContainers(addTo: HTMLElement): { cloze: HTMLDivElement } {
    const clozeContainerElement = document.createElement('div');
    clozeContainerElement.id = 'h5p-cloze-container';
    if (this.settings.clozeType === ClozeType.Select) {
      clozeContainerElement.className = 'h5p-advanced-blanks-select-mode';
    }
    else {
      clozeContainerElement.className = 'h5p-advanced-blanks-type-mode';
    }
    addTo.appendChild(clozeContainerElement);

    return {
      cloze: clozeContainerElement
    };
  }

  /**
   * Create and attaches highlight view.
   * @param {Highlight} highlight Highlight to create view for.
   */
  private createHighlightView(highlight: Highlight): void {
    const highlightView = new HighlightView(highlight);
    this.highlightsViews[highlight.id] = highlightView;

    const parent = document.querySelector(`#container_${highlight.id}`);
    parent?.appendChild(highlightView.getDOM());
  }

  /**
   * Create and attaches blank view.
   * @param {Blank} blank Blank to create view for.
   */
  private createBlankView(blank: Blank): void {
    const blankView = new BlankView(blank, this.isSelectCloze, {
      requestCloseTooltip: this.requestCloseTooltip,
      checkBlank: this.checkBlank,
      textTyped: this.textTyped,
      focus: this.focus,
      showHint: this.showHint,
      displayFeedback: this.displayFeedback,
      textChanged: this.onTextChanged
    });

    this.blankViews[blank.id] = blankView;

    const parent = document.querySelector(`#container_${blank.id}`);
    parent?.appendChild(blankView.getDOM());
  }

  /**
   * Create views for all highlights and blanks.
   */
  private createViews(): void {
    for (const highlight of this.cloze.highlights) {
      this.createHighlightView(highlight);
    }

    for (const blank of this.cloze.blanks) {
      this.createBlankView(blank);
    }
  }

  /**
   * Update all views of highlights and blanks after model changes.
   */
  private refreshCloze(): void {
    for (const highlight of this.cloze.highlights) {
      const highlightView = this.highlightsViews[highlight.id];
      highlightView?.set(highlight);
    }

    for (const blank of this.cloze.blanks) {
      const blankView = this.blankViews[blank.id];
      blankView?.set(blank);
    }
  }

  /**
   * Check cloze completeness and notifies listeners of score changes.
   * @returns {boolean} True if the cloze is solved.
   */
  private checkAndNotifyCompleteness = (): boolean => {
    if (this.onScoreChanged) {
      this.onScoreChanged(this.currentScore, this.maxScore);
    }

    if (this.cloze.isSolved) {
      if (this.onSolved) {
        this.onSolved();
      }
      return true;
    }

    return false;
  };

  /**
   * Serialize current cloze state to strings.
   * @returns {string[]} Array of user answers per blank.
   */
  public serializeCloze(): string[] {
    return this.cloze.serialize();
  }

  /**
   * Deserialize cloze state from data.
   * @param {any} data Data to deserialize.
   * @returns {boolean} True if deserialization succeeded.
   */
  public deserializeCloze(data: any): boolean {
    if (!this.cloze || !data) {
      return false;
    }

    this.cloze.deserialize(data);
    this.refreshCloze();

    return true;
  }

  /**
   * Retrieve list of correct answers for all blanks.
   * @returns {string[][]} List of correct answer lists per blank.
   */
  public getCorrectAnswerList(): string[][] {
    if (!this.cloze || this.cloze.blanks.length === 0) {
      return [[]];
    }

    const result = [];
    for (const blank of this.cloze.blanks) {
      result.push(blank.getCorrectAnswers());
    }

    return result;
  }
}
