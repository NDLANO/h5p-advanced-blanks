import './h5p-advanced-blanks.css';
import { BlankLoader } from '@content-loaders/blank-loader';
import { H5PDataRepository, IDataRepository } from '@services/data-repository';
import { ClozeController } from '@controllers/cloze-controller';
import { H5PLocalization, LocalizationLabels, LocalizationStructures } from '@services/localization';
import { ISettings, H5PSettings } from '@services/settings';
import { MessageService } from '@services/message-service';
import { Unwrapper } from '@helpers/unwrapper';
import { XAPIActivityDefinition } from '@models/xapi';
import { extend } from '@helpers/helpers';

/** Application state enumeration for cloze workflow. */
enum States {
  ongoing = 'ongoing',
  checking = 'checking',
  showingSolutions = 'showing-solution',
  finished = 'finished',
  showingSolutionsEmbedded = 'showing-solution-embedded'
}

/** XAPI extension key for alternative responses. */
const XAPI_ALTERNATIVE_EXTENSION = 'https://h5p.org/x-api/alternatives';

/** XAPI extension key for case sensitivity setting. */
const XAPI_CASE_SENSITIVITY = 'https://h5p.org/x-api/case-sensitivity';

/** XAPI extension key for reporting version. */
const XAPI_REPORTING_VERSION_EXTENSION = 'https://h5p.org/x-api/h5p-reporting-version';

/**
 * Main class for H5P Advanced Blanks content type.
 */
export default class AdvancedBlanks extends (H5P.Question as { new( type:string, options?:object ): any; }) {

  /** Controller for cloze interaction logic. */
  private clozeController: ClozeController;

  /** Repository for accessing cloze content data. */
  private repository: IDataRepository;

  /** Application settings. */
  private settings: ISettings;

  /** Localization service. */
  private localization: H5PLocalization;

  /** Service for displaying messages. */
  private messageService: MessageService;

  /** jQuery instance for DOM queries. */
  private jQuery: JQueryStatic;

  /** Content ID for this cloze instance. */
  private contentId: string;

  /** Previous state for restoring user progress. */
  private previousState: any;

  /** True if previous state was successfully restored. */
  private restoredPreviousState: boolean = false;

  /** Current workflow state of cloze. */
  private state: States;

  /** True if user has entered any answer so far. */
  private answered: boolean = false;

  /**
   * Create AdvancedBlanks instance.
   * @class
   * @param {object} params Paremeters.
   * @param {string} contentId Content ID.
   * @param {object} extras Content data.
   */
  constructor(params: any, contentId: string, extras: any = {}) {
    super('advanced-blanks', { theme: true });

    // Set mandatory default values for editor widgets that create content type instances
    params = extend({
      content: {
        blanksText: ''
      },
      behaviour: {
        mode: 'typing',
        selectAlternatives: 'alternatives'
      },
      submitAnswer: 'Submit',
      a11yCheck: 'Check the answers. The responses will be marked as correct or incorrect.',
      a11ySubmitAndCheck: 'Submit the answers and check them. The responses will be marked as correct or incorrect.',
      a11yShowSolution: 'Show the solution. The blanks will show the expected solution.',
      a11yRetry: 'Retry the task. Reset all responses and start the task over again.',
    }, params);

    this.jQuery = H5P.jQuery;
    this.contentId = contentId;
    this.extras = extras;

    const unwrapper = new Unwrapper(this.jQuery);

    this.settings = new H5PSettings(params);
    this.localization = new H5PLocalization(params);
    this.repository = new H5PDataRepository(
      params, this.settings, this.localization, <JQueryStatic> this.jQuery, unwrapper
    );
    this.messageService = new MessageService(this.jQuery);
    BlankLoader.initialize(this.settings, this.localization, this.jQuery, this.messageService);

    this.clozeController = new ClozeController(this.repository, this.settings, this.localization, this.messageService);

    this.clozeController.onScoreChanged = this.onScoreChanged;
    this.clozeController.onSolved = this.onSolved;
    this.clozeController.onAutoChecked = this.onAutoChecked;
    this.clozeController.onTyped = this.onTyped;
    this.clozeController.onTextChanged = () => this.triggerXAPI('interacted');

    if (extras?.previousState) {
      this.previousState = extras.previousState;
    }

    this.clozeController.setupModel();
    this.restoredPreviousState = this.clozeController.deserializeCloze(this.previousState);
    if (this.restoredPreviousState) {
      this.answered = this.clozeController.isFilledOut;
    }
  }

  /**
   * Called from outside when score of cloze changed.
   */
  private onScoreChanged = (score: number, maxScore: number) => {
    if (this.clozeController.isFullyFilledOut) {
      this.transitionState();
      if (this.state !== States.finished) {
        this.state = States.checking;
      }
      this.showFeedback();
    }
    else {
      this.setFeedback('', score, maxScore);
    }

    this.transitionState();
    this.toggleButtonVisibility(this.state);
  };

  /**
   * Called when cloze is fully solved.
   */
  private onSolved() {

  }

  /**
   * Called when user types in blank.
   */
  private onTyped = () => {
    if (this.state === States.checking) {
      this.state = States.ongoing;
      this.toggleButtonVisibility(this.state);
    }
    this.answered = true;
  };

  /**
   * Called when auto-check triggers.
   */
  private onAutoChecked = () => {
    this.triggerXAPI('interacted');
    if (this.clozeController.isFullyFilledOut) {
      this.triggerXAPIAnswered();
    }
  };

  /**
   * Called by H5P.Question.attach(). Create all content elements and registers them with H5P.Question.
   */
  registerDomElements = () => {
    this.registerMedia();
    this.setIntroduction(this.repository.getTaskDescription());

    this.container = document.createElement('div');
    this.container.classList.add('h5p-advanced-blanks-content');

    this.setContent(H5P.jQuery(this.container));
    this.registerButtons();

    this.moveToState(States.ongoing);
    window.requestAnimationFrame(() => {
      const $h5pContainer = this.container.closest('.h5p-advanced-blanks');
      this.clozeController.render(this.container, $h5pContainer);
      if (this.restoredPreviousState) {
        if (this.settings.autoCheck) {
          this.onCheckAnswer();
        }
        this.toggleButtonVisibility(this.state);
      }
    });
  };

  /**
   * Return outer H5P container element for attaching dialogs.
   * @returns {JQuery} Outer H5P container.
   */
  private getH5pContainer(): JQuery {
    const $content = this.jQuery('[data-content-id="' + this.contentId + '"].h5p-content');
    const $containerParents = $content.parents('.h5p-container');

    // select find container to attach dialogs to
    let $container: JQuery;
    if ($containerParents.length !== 0) {
      // use parent highest up if any
      $container = $containerParents.last();
    }
    else if ($content.length !== 0) {
      $container = $content;
    }
    else {
      $container = this.jQuery(document.body);
    }

    return $container;
  }

  /**
   * Register media (image/video) for the cloze.
   */
  private registerMedia() {
    const media = this.repository.getMedia();
    if (!media || !media.library) {
      return;
    }

    const type = media.library.split(' ')[0];
    if (type === 'H5P.Image') {
      if (media.params.file) {
        this.setImage(media.params.file.path, {
          disableImageZooming: this.settings.disableImageZooming,
          alt: media.params.alt
        });
      }
    }
    else if (type === 'H5P.Video') {
      if (media.params.sources) {
        this.setVideo(media);
      }
    }
    else if (type === 'H5P.Audio') {
      if (media.params.files) {
        this.setAudio(media);
      }
    }
  }

  /**
   * Register action buttons (check, show solution, retry).
   */
  private registerButtons() {
    const $container = this.getH5pContainer();
    const isSubmitting = this.extras?.standalone && (this.extras?.isScoringEnabled || this.extras?.isReportingEnabled);

    if (!this.settings.autoCheck) {
      // Check answer button
      this.addButton(
        'check-answer',
        this.localization.getTextFromLabel(LocalizationLabels.checkAllButton),
        this.onCheckAnswer,
        true,
        {
          'aria-label': isSubmitting ?
            this.localization.getTextFromLabel(LocalizationLabels.a11ySubmitAndCheck) :
            this.localization.getTextFromLabel(LocalizationLabels.a11yCheck),
        },
        {
          confirmationDialog: {
            enable: this.settings.confirmCheckDialog,
            l10n: this.localization.getObjectForStructure(LocalizationStructures.confirmCheck),
            instance: this,
            $parentElement: $container,
          },
          contentData: this.extras,
          textIfSubmitting: this.localization.getTextFromLabel(LocalizationLabels.submitAllButton),
          icon: 'check'
        });
    }

    // Show solution button
    this.addButton(
      'show-solution',
      this.localization.getTextFromLabel(LocalizationLabels.showSolutionButton),
      this.onShowSolution,
      this.settings.enableSolutionsButton,
      {
        'aria-label': this.localization.getTextFromLabel(LocalizationLabels.a11yShowSolution),
      },
      {
        styleType: 'secondary',
        icon: 'show-solutions',
      }
    );

    // Try again button
    if (this.settings.enableRetry === true) {
      this.addButton(
        'try-again',
        this.localization.getTextFromLabel(LocalizationLabels.retryButton),
        this.onRetry,
        true,
        {
          'aria-label': this.localization.getTextFromLabel(LocalizationLabels.a11yRetry),
        },
        {
          confirmationDialog: {
            enable: this.settings.confirmRetryDialog,
            l10n: this.localization.getObjectForStructure(LocalizationStructures.confirmRetry),
            instance: this,
            $parentElement: $container
          },
          styleType: 'secondary',
          icon: 'retry'
        });
    }
  }

  /**
   * Handle check answer button click.
   */
  private onCheckAnswer = () => {
    this.clozeController.checkAll();

    this.triggerXAPI('interacted');
    this.triggerXAPIAnswered();

    this.transitionState();
    if (this.state !== States.finished) {
      this.state = States.checking;
    }

    this.showFeedback();

    this.toggleButtonVisibility(this.state);
  };

  /**
   * Transition to finished state if cloze is solved.
   */
  private transitionState = () => {
    if (this.clozeController.isSolved) {
      this.moveToState(States.finished);
    }
  };

  /**
   * Handle show solution button click.
   */
  private onShowSolution = () => {
    this.moveToState(States.showingSolutions);
    this.clozeController.showSolutions();
    this.showFeedback();
  };

  /**
   * Handle retry button click.
   */
  private onRetry = () => {
    this.removeFeedback();
    this.clozeController.reset();
    this.answered = false;
    this.moveToState(States.ongoing);
    // Reset timer
    this.setActivityStarted(true);
  };

  /**
   * Display feedback with score and overall feedback message.
   */
  private showFeedback() {
    const scoreText = H5P.Question.determineOverallFeedback(
      this.localization.getObjectForStructure(LocalizationStructures.overallFeedback),
      this.clozeController.currentScore / this.clozeController.maxScore
    ).replace('@score', this.clozeController.currentScore).replace('@total', this.clozeController.maxScore);

    this.setFeedback(
      scoreText,
      this.clozeController.currentScore,
      this.clozeController.maxScore,
      this.localization.getTextFromLabel(LocalizationLabels.scoreBarLabel)
    );
  }

  /**
   * Show or hide buttons depending on the current state and settings made by content creator.
   * @param {States} state Workflow state to set.
   */
  private moveToState(state: States) {
    this.state = state;
    this.toggleButtonVisibility(state);
  }

  /**
   * Toggle visibility of action buttons based on current state.
   * @param {States} state Current workflow state.
   */
  private toggleButtonVisibility(state: States) {
    if (this.settings.enableSolutionsButton) {
      if (((state === States.checking)
        || (this.settings.autoCheck && state === States.ongoing))
        && (!this.settings.showSolutionsRequiresInput || this.clozeController.allBlanksEntered)) {
        this.showButton('show-solution');
      }
      else {
        this.hideButton('show-solution');
      }
    }

    if (
      this.settings.enableRetry &&
      (state === States.checking || state === States.finished || state === States.showingSolutions)
    ) {
      this.showButton('try-again');
    }
    else {
      this.hideButton('try-again');
    }

    if (state === States.ongoing && this.settings.enableCheckButton) {
      this.showButton('check-answer');
    }
    else {
      this.hideButton('check-answer');
    }

    if (state === States.showingSolutionsEmbedded) {
      this.hideButton('check-answer');
      this.hideButton('try-again');
      this.hideButton('show-solution');
    }

    this.trigger('resize');
  }

  /**
   * Workaround for H5P core mutating prototype to inject its isRoot, but ES6 inheritance here.
   * @returns {boolean} True, if content type is root. Else false.
   */
  public isRoot():boolean {
    return !!this.extras.standalone;
  }

  /**
   * Return current state of all blanks.
   * @returns {string[]} User-entered text per blank.
   */
  public getCurrentState = (): string[] => {
    return this.clozeController.serializeCloze();
  };

  /**
   * Determine whether answer has been given.
   * @returns {boolean} True if user answered or no blanks exist.
   */
  public getAnswerGiven = (): boolean => {
    return this.answered || this.clozeController.maxScore === 0;
  };

  /**
   * Get current score.
   * @returns {number} Current score.
   */
  public getScore = (): number => {
    return this.clozeController.currentScore;
  };

  /**
   * Get maximum possible score.
   * @returns {number} Maximum score.
   */
  public getMaxScore = (): number => {
    return this.clozeController.maxScore;
  };

  /**
   * Show solutions and moves to embedded showing state.
   */
  public showSolutions = () => {
    this.onCheckAnswer();
    this.onShowSolution();
    this.moveToState(States.showingSolutionsEmbedded);
  };

  /**
   * Reset task by retrying.
   */
  public resetTask = () => {
    this.onRetry();
  };

  /**
   * Trigger xAPI answered event.
   */
  public triggerXAPIAnswered = (): void => {
    this.answered = true;
    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);
  };

  /**
   * Get xAPI data.
   * @see contract at {@link https://h5p.org/documentation/developers/developers#guides-header-6}
   */
  public getXAPIData = () => {
    const xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    return {
      statement: xAPIEvent.data.statement
    };
  };

  /**
   * Generate xAPI object definition used in xAPI statements.
   * @returns {XAPIActivityDefinition} XAPI activity definition.
   */
  public getxAPIDefinition = (): XAPIActivityDefinition => {
    const definition = new XAPIActivityDefinition();

    definition.description = {
      'en-US': '<p>' + this.repository.getTaskDescription() + '</p>' +
      this.repository.getClozeText().replace(/__(_)+/g, '__________').replace(/!!/g, '')
    };

    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    // We use the 'fill-in' type even in select mode, as the xAPI format for selections doesn't cater for sequences.
    definition.interactionType = 'fill-in';

    const correctResponsesPatternPrefix = '{case_matters=' + this.settings.caseSensitive + '}';

    const correctAnswerList = this.clozeController.getCorrectAnswerList();

    // H5P uses extension instead of full correct responses pattern to counter complexity
    const firstAlternatives = correctAnswerList.reduce((result, list) => {
      result.push(list[0]);
      return result;
    }, []).join('[,]');
    definition.correctResponsesPattern = [`${correctResponsesPatternPrefix}${firstAlternatives}`];

    /*
     * Add H5P Alternative extension which provides all combinations of different answers
     * Reporting software will need to support this extension for alternatives to work.
     */
    definition.extensions = definition.extensions || {};
    definition.extensions[XAPI_CASE_SENSITIVITY] = this.settings.caseSensitive;
    definition.extensions[XAPI_ALTERNATIVE_EXTENSION] = correctAnswerList;

    return definition;
  };

  /**
   * Add question itself to definition part of xAPIEvent.
   * @param {H5P.XAPIEvent} xAPIEvent xAPI event to add question to.
   */
  public addQuestionToXAPI = (xAPIEvent: any) => {
    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    this.jQuery.extend(true, definition, this.getxAPIDefinition());

    // Set reporting module version if alternative extension is used
    if (this.clozeController.hasAlternatives) {
      const context = xAPIEvent.getVerifiedStatementValue(['context']);
      context.extensions = context.extensions || {};
      context.extensions[XAPI_REPORTING_VERSION_EXTENSION] = '1.0.0';
    }
  };

  /**
   * Add response part to xAPI event.
   *
   * @param {H5P.XAPIEvent} xAPIEvent The xAPI event we will add a response to.
   */
  public addResponseToXAPI = (xAPIEvent: any) => {
    xAPIEvent.setScoredResult(this.clozeController.currentScore, this.clozeController.maxScore, this);
    xAPIEvent.data.statement.result.response = this.getxAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @returns {string} User answers separated by "[,]" pattern.
   */
  public getxAPIResponse = (): string => {
    const usersAnswers = this.getCurrentState();
    return usersAnswers.join('[,]');
  };
}
