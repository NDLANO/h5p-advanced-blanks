import { MessageService } from '@services/message-service';
import { ClozeElement, ClozeElementType } from './cloze-element';
import { Answer } from './answer';
import { Correctness } from './evaluation';
import { Message } from './message';
import { MessageType, ClozeType, SelectAlternatives } from './enums';
import { H5PLocalization, LocalizationLabels } from '@services/localization';
import { ISettings } from '@services/settings';
import { getLongestString, shuffleArray } from '@helpers/helpers';
import * as jsdiff from 'diff';

/**
 * Represent blank in cloze exercise, handling answers, feedback, and state.
 */
export class Blank extends ClozeElement {
  /** List of correct answers for this blank. */
  correctAnswers: Answer[];

  /** List of incorrect answers for this blank. */
  incorrectAnswers: Answer[];

  /** Hint message displayed to user. */
  hint: Message;

  /** Unique identifier for this blank. */
  id: string;

  /** List of choices for select-mode blanks. */
  choices: string[];

  /** Order of alternatives as entered by content author. */
  defaultOrder: string[];

  /** True if this blank has a hint. */
  hasHint: boolean;

  /** Text last checked against answers. */
  lastCheckedText: string;

  /** Text entered by the user. */
  enteredText: string;

  /** True if the answer is correct. */
  isCorrect: boolean;

  /** True if the answer is incorrect. */
  isError: boolean;

  /** True if the user is being asked to retry. */
  isRetry: boolean;

  /** True if feedback is pending display. */
  hasPendingFeedback: boolean;

  /** True if showing the solution. */
  isShowingSolution: boolean;

  /** True if the blank is disabled. */
  isDisabled: boolean;

  /** Message text to display. */
  message: string;

  /** Minimum text length for input box. */
  minTextLength: number;

  /** Speech bubble element reference. */
  speechBubble: any;

  /**
   * Create Blank instance.
   * @class
   * @param {ISettings} settings Application settings.
   * @param {H5PLocalization} localization Localization service.
   * @param {JQueryStatic} jquery jQuery instance.
   * @param {MessageService} messageService Message service.
   * @param {string} id Blank identifier.
   */
  constructor(
    private settings: ISettings,
    private localization: H5PLocalization,
    private jquery: JQueryStatic,
    private messageService: MessageService,
    id: string
  ) {
    super();

    this.enteredText = '';
    this.isDisabled = false;
    this.correctAnswers = [];
    this.incorrectAnswers = [];
    this.choices = [];
    this.type = ClozeElementType.Blank;

    this.id = id;
  }

  /**
   * Finalize initialization after all incorrect answers are added.
   */
  public finishInitialization(): void {
    if (
      this.settings.clozeType === ClozeType.Select &&
      this.settings.selectAlternatives === SelectAlternatives.Alternatives
    ) {
      this.loadChoicesFromOwnAlternatives();
    }
    this.calculateMinTextLength();
  }

  /**
   * Add correct answer to blank.
   * @param {Answer} answer Answer to add.
   */
  public addCorrectAnswer(answer: Answer): void {
    this.correctAnswers.push(answer);
  }

  /**
   * Return all correct answer alternatives.
   * @returns {string[]} List of correct answer strings.
   */
  public getCorrectAnswers(): string[] {
    let result = [];
    for (const answer of this.correctAnswers) {
      result = result.concat(answer.alternatives);
    }

    return result;
  }

  /**
   * Set hint message for blank.
   * @param {Message} message Hint message.
   */
  public setHint(message: Message): void {
    this.hint = message;
    this.hasHint = this.hint.text !== '';
  }

  /**
   * Set alternatives in order entered by content author.
   */
  public setDefaultOrder(defaultOrder: string[]): void {
    this.defaultOrder = defaultOrder;
  }

  /**
   * Add incorrect answer to list.
   * @param {string} text Text the user must enter.
   * @param {string} reaction Feedback shown when user enters the text.
   * @param {boolean} showHighlight Whether to show a highlight.
   * @param {number} highlight Highlight index.
   */
  public addIncorrectAnswer(text: string, reaction: string, showHighlight: boolean, highlight: number): void {
    this.incorrectAnswers.push(new Answer(text, reaction, showHighlight, highlight, this.settings));
  }

  /**
   * Calculate minimum input box length to accommodate all correct answers.
   */
  private calculateMinTextLength(): void {
    const answers: string[] = [];
    for (const correctAnswer of this.correctAnswers) {
      answers.push(getLongestString(correctAnswer.alternatives));
    }

    if (this.settings.clozeType === ClozeType.Select) {
      for (const incorrectAnswer of this.incorrectAnswers) {
        answers.push(getLongestString(incorrectAnswer.alternatives));
      }
    }

    const longestAnswer = getLongestString(answers);
    const l = longestAnswer.length;
    this.minTextLength = Math.max(10, l - (l % 10) + 10);
  }

  /**
   * Create list of choices from own alternatives, respecting content author order.
   * @returns {string[]} List of choices for select-mode.
   */
  private loadChoicesFromOwnAlternatives(): string[] {
    if (this.defaultOrder) {
      this.choices = this.defaultOrder
        .reduce((choices, choice) => {
          return [...choices, ...choice.split('/')];
        }, []);
    }
    else {
      this.choices = [];
      for (const answer of this.correctAnswers) {
        for (const alternative of answer.alternatives) {
          this.choices.push(alternative);
        }
      }

      for (const answer of this.incorrectAnswers) {
        for (const alternative of answer.alternatives) {
          this.choices.push(alternative);
        }
      }
    }

    if (this.settings.randomAnswers) {
      this.choices = shuffleArray(this.choices);
    }
    this.choices.unshift('');

    return this.choices;
  }

  /**
   * Create list of choices from all correct answers of other blanks.
   * @param {Blank[]} otherBlanks All other blanks in the cloze (excludes current).
   * @returns {string[]} List of choices for select-mode.
   */
  public loadChoicesFromOtherBlanks(otherBlanks: Blank[]): string[] {
    const ownChoices = [];
    for (const answer of this.correctAnswers) {
      for (const alternative of answer.alternatives) {
        ownChoices.push(alternative);
      }
    }

    let otherChoices = [];
    for (const otherBlank of otherBlanks) {
      for (const answer of otherBlank.correctAnswers) {
        for (const alternative of answer.alternatives) {
          otherChoices.push(alternative);
        }
      }
    }

    otherChoices = shuffleArray(otherChoices);

    let maxChoices = this.settings.selectAlternativeRestriction;
    if (maxChoices === undefined || maxChoices === 0) {
      maxChoices = ownChoices.length + otherChoices.length;
    }

    let leftOverChoices = maxChoices - ownChoices.length;
    for (let x = 0; x < leftOverChoices && x < otherChoices.length; x++) {
      if (ownChoices.indexOf(otherChoices[x]) >= 0) {
        leftOverChoices++;
      }
      else {
        ownChoices.push(otherChoices[x]);
      }
    }

    this.choices = shuffleArray(ownChoices);
    this.choices.unshift('');

    return this.choices;
  }

  /**
   * Clear blank from all entered text and hide popups.
   */
  public reset(): void {
    this.enteredText = '';
    this.lastCheckedText = '';
    this.removeTooltip();
    this.setAnswerState(MessageType.None);
    this.hasPendingFeedback = false;
    this.isDisabled = false;
  }

  /**
   * Show solution for blank if no correct answer was entered.
   */
  public showSolution(): void {
    this.evaluateAttempt(true);
    this.removeTooltip();
    if (this.isCorrect) {
      return;
    }

    this.setAnswerState(MessageType.ShowSolution);
  }

  /**
   * Handle focus event for blank.
   */
  public onFocused(): void {
    if (this.hasPendingFeedback) {
      this.evaluateAttempt(false);
    }
    if (this.settings.clozeType === ClozeType.Select) {
      this.setAnswerState(MessageType.None);
      this.lastCheckedText = '';
    }
  }

  /**
   * Handle feedback display event for blank.
   */
  public onDisplayFeedback(): void {
    if (this.hasPendingFeedback) {
      this.evaluateAttempt(false);
    }
  }

  /**
   * Display tooltip message to user.
   * @param {string} message Message text to display.
   * @param {MessageType} type Type of message.
   * @param {boolean} surpressTooltip Whether to suppress tooltip display.
   * @param {string} [id] Optional highlight ID.
   */
  private displayTooltip(message: string, type: MessageType, surpressTooltip: boolean, id?: string): void {
    if (!surpressTooltip) {
      this.messageService.show(id ? id : this.id, message, this);
    }
    else {
      this.hasPendingFeedback = true;
    }
  }

  /**
   * Hide active tooltip.
   */
  public removeTooltip(): void {
    this.messageService.hide();
  }

  /**
   * Set error tooltip text with highlighting if applicable.
   * @param {Message} message Message containing error text.
   * @param {boolean} surpressTooltip Whether to suppress tooltip display.
   */
  private setTooltipErrorText(message: Message, surpressTooltip: boolean): void {
    if (message.highlightedElement) {
      this.displayTooltip(message.text, MessageType.Error, surpressTooltip, message.highlightedElement.id);
    }
    else {
      this.displayTooltip(message.text, MessageType.Error, surpressTooltip);
    }
  }

  /**
   * Generate spelling mistake message with highlighted differences.
   * @param {string} expectedText Expected answer text.
   * @param {string} enteredText Text entered by user.
   * @returns {string} Formatted spelling mistake message.
   */
  private getSpellingMistakeMessage(expectedText: string, enteredText: string): string {
    let message = this.localization.getTextFromLabel(LocalizationLabels.typoMessage);

    const diff = jsdiff.diffChars(expectedText, enteredText, { ignoreCase: !this.settings.caseSensitive });

    const mistakeSpan = this.jquery('<span/>', { 'class': 'spelling-mistake' });
    for (let index = 0; index < diff.length; index++) {
      const part = diff[index];
      let spanClass = '';
      if (part.removed) {
        if (index === diff.length - 1 || !diff[index + 1].added) {
          part.value = part.value.replace(/./g, '_');
          spanClass = 'missing-character';
        }
        else {
          continue;
        }
      }
      if (part.added) {
        spanClass = 'mistaken-character';
      }

      const span = this.jquery('<span/>', { 'class': spanClass, 'html': part.value.replace(' ', '&nbsp;') });
      mistakeSpan.append(span);
    }

    message = message.replace('@mistake', this.jquery('<span/>').append(mistakeSpan).html());

    return message;
  }

  /**
   * Evaluate user-entered text against correct and incorrect answers, providing feedback.
   * @param {boolean} surpressTooltips Whether to suppress tooltip display.
   * @param {boolean} [forceCheck] Whether to force re-checking.
   */
  public evaluateAttempt(surpressTooltips: boolean, forceCheck?: boolean): void {
    if (!this.hasPendingFeedback && this.lastCheckedText === this.enteredText && !forceCheck) {
      return;
    }

    this.lastCheckedText = this.enteredText.toString();
    this.hasPendingFeedback = false;
    this.removeTooltip();

    const getMatches = (answers: Answer[], correctness: Correctness) => {
      return answers
        .map((answer) => answer.evaluateAttempt(this.enteredText))
        .filter((evaluation) => evaluation.correctness === correctness)
        .sort(
          (a, b) => a.characterDifferenceCount - b.characterDifferenceCount
        );
    };

    const exactCorrectMatches = getMatches(this.correctAnswers, Correctness.ExactMatch);
    const closeCorrectMatches = getMatches(this.correctAnswers, Correctness.CloseMatch);
    const exactIncorrectMatches = getMatches(this.incorrectAnswers, Correctness.ExactMatch);
    const closeIncorrectMatches = getMatches(this.incorrectAnswers, Correctness.CloseMatch);

    if (exactCorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Correct);
      if (!this.settings.caseSensitive) {
        this.enteredText = exactCorrectMatches[0].usedAlternative;
      }
      return;
    }

    if (exactIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(exactIncorrectMatches[0].usedAnswer, surpressTooltips);
      return;
    }

    if (closeCorrectMatches.length > 0) {
      if (this.settings.warnSpellingErrors) {
        this.displayTooltip(
          this.getSpellingMistakeMessage(closeCorrectMatches[0].usedAlternative,
            this.enteredText),
          MessageType.Retry,
          surpressTooltips
        );
        this.setAnswerState(MessageType.Retry);
        return;
      }
      if (this.settings.acceptSpellingErrors) {
        this.setAnswerState(MessageType.Correct);
        this.enteredText = closeCorrectMatches[0].usedAlternative;
        return;
      }
    }

    if (closeIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(closeIncorrectMatches[0].usedAnswer, surpressTooltips);
      return;
    }

    const alwaysApplyingAnswers = this.incorrectAnswers.filter((a) => a.appliesAlways);
    if (alwaysApplyingAnswers && alwaysApplyingAnswers.length > 0) {
      this.showErrorTooltip(alwaysApplyingAnswers[0], surpressTooltips);
    }

    this.setAnswerState(MessageType.Error);
  }

  /**
   * Handle text typed event, clearing feedback state.
   */
  public onTyped(): void {
    this.setAnswerState(MessageType.None);
    this.lastCheckedText = '';
    this.removeTooltip();
  }

  /**
   * Handle blur event, hiding active tooltip.
   */
  public lostFocus(): void {
    if (this.messageService.isActive(this)) {
      this.messageService.hide();
    }
  }

  /**
   * Set answer state properties based on message type.
   * @param {MessageType} messageType Type of message determining state.
   */
  private setAnswerState(messageType: MessageType): void {
    this.isCorrect = false;
    this.isError = false;
    this.isRetry = false;
    this.isShowingSolution = false;

    switch (messageType) {
      case MessageType.Correct:
        this.isCorrect = true;
        break;
      case MessageType.Error:
        this.isError = true;
        break;
      case MessageType.Retry:
        this.isRetry = true;
        break;
      case MessageType.ShowSolution:
        this.isShowingSolution = true;
        break;
    }
  }

  /**
   * Show error tooltip for given answer.
   * @param {Answer} answer Answer that triggered the error.
   * @param {boolean} surpressTooltip Whether to suppress tooltip display.
   */
  private showErrorTooltip(answer: Answer, surpressTooltip: boolean): void {
    if (answer.message && answer.message.text) {
      this.setTooltipErrorText(answer.message, surpressTooltip);
    }
    if (!surpressTooltip) {
      answer.activateHighlight();
    }
  }

  /**
   * Display hint in tooltip.
   */
  public showHint(): void {
    if (this.isShowingSolution || this.isCorrect) {
      return;
    }

    this.removeTooltip();
    if (this.hint && this.hint.text !== '') {
      this.displayTooltip(this.hint.text, MessageType.Retry, false);
      if (this.hint.highlightedElement) {
        this.hint.highlightedElement.isHighlighted = true;
      }
    }
  }

  /**
   * Serialize blank state to string.
   * @returns {string} User-entered text.
   */
  public serialize(): string {
    return this.enteredText;
  }

  /**
   * Deserialize blank state from data.
   * @param {any} data Data to deserialize.
   */
  public deserialize(data: any): void {
    this.enteredText = data;
  }
}
