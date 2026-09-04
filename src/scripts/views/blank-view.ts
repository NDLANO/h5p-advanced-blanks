import { Blank } from '../models/blank';

/** Callback signatures for blank interactions. */
type BlankCallbacks = {
  requestCloseTooltip: (event: Event, blank: Blank) => void;
  checkBlank: (event: Event, blank: Blank, action: string) => void;
  textTyped: (event: Event, blank: Blank) => void;
  focus: (event: Event, blank: Blank) => void;
  showHint: (event: Event, blank: Blank) => void;
  displayFeedback: (event: Event, blank: Blank) => void;
  textChanged: (event: Event, blank: Blank) => void;
};

/** @constant {object} ICON Icon definitions for blank UI elements. */
const ICONS = {
  NOTIFICATION: '&#xf05a;', // FontAwesome i icon for notification
} as const;

/**
 * View layer for rendering and managing blank input elements.
 */
export default class BlankView {
  /** DOM span element for this blank. */
  private dom: HTMLSpanElement;

  /** Input or select element for user text entry. */
  private inputElement: HTMLInputElement | HTMLSelectElement;

  /** Tip/help button element. */
  private tipButton: HTMLButtonElement;

  /** Span element showing correct answer. */
  private solutionSpan: HTMLSpanElement;

  /** Callback handlers for blank interactions. */
  private callbacks: BlankCallbacks = {
    requestCloseTooltip: () => { },
    checkBlank: () => { },
    textTyped: () => { },
    focus: () => { },
    showHint: () => { },
    displayFeedback: () => { },
    textChanged: () => { }
  };

  /**
   * Create BlankView instance.
   * @class
   * @param {Blank} blank Blank model to render.
   * @param {boolean} isSelectCloze True if this is select-mode cloze.
   * @param {BlankCallbacks} callbacks Callback handlers for interactions.
   */
  constructor(blank: Blank, isSelectCloze: boolean, callbacks: BlankCallbacks) {
    this.initializeCallbacks(callbacks);
    this.createDomStructure(blank);

    if (isSelectCloze) {
      this.createSelectElement(blank);
    }
    else {
      this.createInputElement(blank);
    }

    this.dom.append(this.solutionSpan);
  }

  /**
   * Initializes callback handlers from provided callbacks.
   * @param {BlankCallbacks} callbacks Callback handlers to initialize.
   */
  private initializeCallbacks(callbacks: BlankCallbacks): void {
    Object.assign(this.callbacks, callbacks);
  }

  /**
   * Create DOM structure for this blank view.
   * @param {Blank} blank Blank model to render.
   */
  private createDomStructure(blank: Blank): void {
    this.dom = document.createElement('span');
    this.dom.id = `container${blank.id}`;
    this.dom.classList.add('blank');
    this.updateDomClasses(blank);

    this.solutionSpan = document.createElement('span');
    this.solutionSpan.classList.add('correct-answer');
    this.solutionSpan.hidden = true;
  }

  /**
   * Update CSS classes on DOM element based on blank state.
   * @param {Blank} blank Blank model with current state.
   */
  private updateDomClasses(blank: Blank): void {
    this.dom.classList.toggle('has-pending-feedback', blank.hasPendingFeedback ?? false);
    this.dom.classList.toggle('has-tip', blank.hasHint ?? false);
    this.dom.classList.toggle('correct', blank.isCorrect ?? false);
    this.dom.classList.toggle('error', blank.isError ?? false);
    this.dom.classList.toggle('retry', blank.isRetry ?? false);
    this.dom.classList.toggle('showing-solution', blank.isShowingSolution ?? false);
    this.dom.classList.toggle('disabled', blank.isDisabled ?? false);
  }

  /**
   * Build tip container element with hint button.
   * @param {Blank} blank Blank model to build tip for.
   * @returns {HTMLSpanElement} Tip container element.
   */
  private buildTipContainer(blank: Blank): HTMLSpanElement {
    const tipContainer = document.createElement('span');
    tipContainer.classList.add('h5p-tip-container');

    this.tipButton = document.createElement('button');
    this.tipButton.disabled = blank.isCorrect || blank.isShowingSolution;
    this.tipButton.addEventListener('click', (event: MouseEvent) => {
      this.callbacks.showHint(event, blank);
    });
    tipContainer.append(this.tipButton);

    const joubelTipContainer = document.createElement('span');
    joubelTipContainer.classList.add('joubel-tip-container');
    joubelTipContainer.setAttribute('title', 'Tip'); // TODO: Need to localize this
    joubelTipContainer.setAttribute('aria-label', 'Tip'); // TODO: Need to localize this
    joubelTipContainer.setAttribute('aria-expanded', 'true');
    joubelTipContainer.setAttribute('role', 'button');
    joubelTipContainer.setAttribute('tabindex', '0');
    this.tipButton.append(joubelTipContainer);

    const joubelIconTipNormal = document.createElement('span');
    joubelIconTipNormal.classList.add('joubel-icon-tip-normal');
    joubelTipContainer.append(joubelIconTipNormal);

    const joubelIconShadow = document.createElement('span');
    joubelIconShadow.classList.add('h5p-icon-shadow');
    joubelIconTipNormal.append(joubelIconShadow);

    const joubelIconSpeechBubble = document.createElement('span');
    joubelIconSpeechBubble.classList.add('h5p-icon-speech-bubble');
    joubelIconTipNormal.append(joubelIconSpeechBubble);

    const joubelIconInfo = document.createElement('span');
    joubelIconInfo.classList.add('joubel-icon-info');
    joubelIconTipNormal.append(joubelIconInfo);

    return tipContainer;
  }

  /**
   * Create a select element for select-mode blanks.
   * @param {Blank} blank Blank model to render.
   */
  private createSelectElement(blank: Blank): void {
    this.dom.append(this.buildNotificationButton(blank));

    const inputWrapper = document.createElement('span');
    inputWrapper.classList.add('h5p-input-wrapper');
    this.dom.append(inputWrapper);

    const selectElement = document.createElement('select');
    selectElement.id = blank.id;
    selectElement.classList.add('h5p-text-input');
    selectElement.size = 1;
    selectElement.value = blank.enteredText || '';
    selectElement.disabled = blank.isCorrect || blank.isShowingSolution;

    this.bindInputToBlank(blank, selectElement);
    this.setupSelectEventHandlers(selectElement, blank);

    inputWrapper.append(selectElement);

    for (const choice of blank.choices) {
      const optionElement = document.createElement('option');
      optionElement.textContent = choice;
      selectElement.append(optionElement);
    }

    if (blank.hasHint) {
      const tipContainer = this.buildTipContainer(blank);
      inputWrapper.append(tipContainer);
    }
  }

  /**
   * Build notification button element.
   * @param {Blank} blank Blank model to build notification for.
   * @returns {HTMLButtonElement} Notification button element.
   */
  private buildNotificationButton(blank: Blank): HTMLButtonElement {
    const notificationButton = document.createElement('button');
    notificationButton.classList.add('h5p-notification');
    notificationButton.addEventListener('click', (event) => {
      this.callbacks.displayFeedback(event, blank);
    });
    notificationButton.innerHTML = ICONS.NOTIFICATION;

    return notificationButton;
  }

  /**
   * Create text input element for type-mode blanks.
   * @param {Blank} blank Blank model to render.
   */
  private createInputElement(blank: Blank): void {
    const inputWrapper = document.createElement('span');
    inputWrapper.classList.add('h5p-input-wrapper');
    this.dom.append(inputWrapper);

    this.inputElement = document.createElement('input');
    this.inputElement.classList.add('h5p-text-input');
    this.inputElement.id = blank.id;
    this.inputElement.type = 'text';
    this.inputElement.value = blank.enteredText || '';
    this.inputElement.size = blank.minTextLength;
    this.inputElement.setAttribute('autoComplete', 'off');
    this.inputElement.setAttribute('autoCapitalize', 'off');
    this.inputElement.disabled = blank.isCorrect || blank.isShowingSolution;

    this.bindInputToBlank(blank, this.inputElement);
    this.setupInputEventHandlers(this.inputElement, blank);

    inputWrapper.append(this.inputElement);

    if (blank.hasHint) {
      const tipContainer = this.buildTipContainer(blank);
      inputWrapper.append(tipContainer);
    }
  }

  /**
   * Set up event handlers for text input elements.
   * @param {HTMLInputElement} element Input element to bind handlers to.
   * @param {Blank} blank Blank model for callback context.
   */
  private setupInputEventHandlers(element: HTMLInputElement, blank: Blank): void {
    element.addEventListener('keydown', (event) => this.handleInputKeydown(event, blank));
    element.addEventListener('blur', (event) => this.callbacks.checkBlank(event, blank, 'blur'));
    element.addEventListener('focus', (event) => this.callbacks.focus(event, blank));
    element.addEventListener('change', (event) => this.callbacks.textChanged(event, blank));
  }

  /**
   * Set up event handlers for select elements.
   * @param {HTMLSelectElement} element Select element to bind handlers to.
   * @param {Blank} blank Blank model for callback context.
   */
  private setupSelectEventHandlers(element: HTMLSelectElement, blank: Blank): void {
    element.addEventListener('keydown', (event) => this.handleSelectKeydown(event, blank));
    element.addEventListener('change', (event) => this.callbacks.checkBlank(event, blank, 'change'));
    element.addEventListener('focus', (event) => this.callbacks.focus(event, blank));
  }

  /**
   * Handle keydown events for text input elements.
   * @param {KeyboardEvent} event Keyboard event.
   * @param {Blank} blank Blank model for callback context.
   */
  private handleInputKeydown(event: KeyboardEvent, blank: Blank): void {
    switch (event.key) {
      case 'Escape':
        this.callbacks.requestCloseTooltip(event, blank);
        break;
      case 'Enter':
        this.callbacks.checkBlank(event, blank, 'enter');
        break;
      case ' ':
        this.callbacks.checkBlank(event, blank, 'space');
        break;
      default:
        this.callbacks.textTyped(event, blank);
    }
  }

  /**
   * Handle keydown events for select elements.
   * @param {KeyboardEvent} event Keyboard event.
   * @param {Blank} blank Blank model for callback context.
   */
  private handleSelectKeydown(event: KeyboardEvent, blank: Blank): void {
    if (event.key === 'Enter') {
      this.callbacks.checkBlank(event, blank, 'enter');
    }
  }

  /**
   * Bind input element value to blank enteredText property.
   * @param {Blank} blank Blank model to bind.
   * @param {HTMLInputElement | HTMLSelectElement} inputElement Input element to bind.
   */
  private bindInputToBlank(blank: Blank, inputElement: HTMLInputElement | HTMLSelectElement): void {
    Object.defineProperty(blank, 'enteredText', {
      get: () => inputElement.value,
      set: (value) => {
        inputElement.value = value;
      }
    });
  }

  /**
   * Get DOM element for this view.
   * @returns {HTMLSpanElement} DOM element.
   */
  getDOM(): HTMLSpanElement {
    return this.dom;
  }

  /**
   * Update view with current blank state.
   * @param {Blank} blank Blank model with updated state.
   */
  set(blank: Blank) {
    this.dom.id = `container${blank.id}`;
    this.updateDomClasses(blank);

    const isInputDisabled = blank.isDisabled || blank.isCorrect || blank.isShowingSolution;
    if (this.inputElement instanceof HTMLInputElement) {
      // this.inputElement.value = blank.enteredText || '';
      this.inputElement.disabled = isInputDisabled;
      this.inputElement.size = blank.minTextLength;
    }
    else if (this.inputElement instanceof HTMLSelectElement) {
      // this.inputElement.value = blank.enteredText || '';
      this.inputElement.disabled = isInputDisabled;
    }

    const showSolution = blank.isShowingSolution && !blank.isCorrect;
    this.solutionSpan.hidden = !showSolution;
    if (showSolution) {
      this.solutionSpan.textContent = blank.getCorrectAnswers()[0];
    }
  }
}
