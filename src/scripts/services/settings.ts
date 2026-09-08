import { ClozeType, SelectAlternatives } from '@models/enums';

/**
 * Interface defining cloze behavior settings.
 */
export interface ISettings {
  /** Type of cloze (Type or Select). */
  clozeType: ClozeType;

  /** Source of select alternatives. */
  selectAlternatives: SelectAlternatives;

  /** Maximum number of select alternatives. */
  selectAlternativeRestriction: number;

  /** True if retry is enabled. */
  enableRetry: boolean;

  /** True if solutions button is enabled. */
  enableSolutionsButton: boolean;

  /** True if check button is enabled. */
  enableCheckButton: boolean;

  /** True if auto-check is enabled. */
  autoCheck: boolean;

  /** True if answers are case-sensitive. */
  caseSensitive: boolean;

  /** True if spelling errors are warned. */
  warnSpellingErrors: boolean;

  /** True if spelling errors are accepted. */
  acceptSpellingErrors: boolean;

  /** True if solutions require input. */
  showSolutionsRequiresInput: boolean;

  /** True if check confirmation dialog is shown. */
  confirmCheckDialog: boolean;

  /** True if retry confirmation dialog is shown. */
  confirmRetryDialog: boolean;

  /** True if image zooming is disabled. */
  disableImageZooming: boolean;

  /** True if answers are randomized. */
  randomAnswers: boolean;
}

/**
 * Default implementation of ISettings, initialized from H5P config.
 */
export class H5PSettings implements ISettings {
  /** Type of cloze (Type or Select). */
  public clozeType: ClozeType = ClozeType.Type;

  /** Source of select alternatives. */
  public selectAlternatives: SelectAlternatives = SelectAlternatives.Alternatives;

  /** Maximum number of select alternatives. */
  public selectAlternativeRestriction: number = 5;

  /** True if retry is enabled. */
  public enableRetry: boolean = true;

  /** True if solutions button is enabled. */
  public enableSolutionsButton: boolean = true;

  /** True if check button is enabled. */
  public enableCheckButton: boolean = true;

  /** True if auto-check is enabled. */
  public autoCheck: boolean = false;

  /** True if answers are case-sensitive. */
  public caseSensitive: boolean = false;

  /** True if spelling errors are warned. */
  public warnSpellingErrors: boolean = true;

  /** True if spelling errors are accepted. */
  public acceptSpellingErrors: boolean = false;

  /** True if solutions require input. */
  public showSolutionsRequiresInput: boolean = true;

  /** True if check confirmation dialog is shown. */
  public confirmCheckDialog: boolean = false;

  /** True if retry confirmation dialog is shown. */
  public confirmRetryDialog: boolean = false;

  /** True if image zooming is disabled. */
  public disableImageZooming: boolean = false;

  /** True if answers are randomized. */
  public randomAnswers: boolean = true;

  /**
   * Create H5PSettings instance from H5P config data.
   * @class
   * @param {any} h5pConfigData H5P configuration data.
   */
  constructor(h5pConfigData: any) {
    if (h5pConfigData.behaviour.mode === 'selection') {
      this.clozeType = ClozeType.Select;
    }
    else {
      this.clozeType = ClozeType.Type;
    }

    if (h5pConfigData.behaviour.selectAlternatives === 'all') {
      this.selectAlternatives = SelectAlternatives.All;
    }
    else if (h5pConfigData.behaviour.selectAlternatives === 'alternatives') {
      this.selectAlternatives = SelectAlternatives.Alternatives;
    }
    else {
      this.selectAlternatives = SelectAlternatives.All;
    }

    this.selectAlternativeRestriction = h5pConfigData.behaviour.selectAlternativeRestriction;
    this.enableRetry = h5pConfigData.behaviour.enableRetry;
    this.enableSolutionsButton = h5pConfigData.behaviour.enableSolutionsButton;
    this.enableCheckButton = h5pConfigData.behaviour.enableCheckButton;
    this.autoCheck = h5pConfigData.behaviour.autoCheck;
    this.caseSensitive = h5pConfigData.behaviour.caseSensitive;
    this.warnSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === 'warn';
    this.acceptSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === 'accept';
    this.showSolutionsRequiresInput = h5pConfigData.behaviour.showSolutionsRequiresInput;
    this.confirmCheckDialog = h5pConfigData.behaviour.confirmCheckDialog;
    this.confirmRetryDialog = h5pConfigData.behaviour.confirmRetryDialog;
    this.disableImageZooming = h5pConfigData.media?.disableImageZooming ?? false;
    this.randomAnswers = h5pConfigData.behaviour.randomAnswers;

    this.enforceLogic();
  }

  /**
   * Set sensible default values for settings hidden with showWhen.
   */
  private enforceLogic(): void {
    if (this.clozeType === ClozeType.Type) {
      this.selectAlternatives = SelectAlternatives.All;
      this.selectAlternativeRestriction = 0;
    }
    else {
      if (this.selectAlternativeRestriction === SelectAlternatives.Alternatives) {
        this.selectAlternativeRestriction = 0;
      }
      this.warnSpellingErrors = false;
      this.acceptSpellingErrors = false;
      this.caseSensitive = false;
    }
  }
}
