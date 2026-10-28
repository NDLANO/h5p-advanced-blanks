import { ClozeType, SelectAlternatives } from '@models/enums';

/**
 * Interface defining cloze behavior settings.
 */
export interface ISettings {
  /** Type of cloze (Type, Select, Number or SelectMultiple). */
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

  /** Return copy of settings with logic for given cloze type enforced. */
  getSettingsForClozeType(clozeType: ClozeType): ISettings;
}

/**
 * Default implementation of ISettings, initialized from H5P config.
 */
export class H5PSettings implements ISettings {
  /** Type of cloze (Type, Select, Number or SelectMultiple). */
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
    else if (h5pConfigData.behaviour.mode === 'typingNumber') {
      this.clozeType = ClozeType.Number;
    }
    else if (h5pConfigData.behaviour.mode === 'selectionMultiple') {
      this.clozeType = ClozeType.SelectMultiple;
    }
    else {
      this.clozeType = ClozeType.Type;
    }

    const selectionSettings = h5pConfigData.behaviour.selectionSettings ?? {};
    const typingSettings = h5pConfigData.behaviour.typingSettings ?? {};

    if (selectionSettings.selectAlternatives === 'all') {
      this.selectAlternatives = SelectAlternatives.All;
    }
    else if (selectionSettings.selectAlternatives === 'alternatives') {
      this.selectAlternatives = SelectAlternatives.Alternatives;
    }
    else {
      this.selectAlternatives = SelectAlternatives.All;
    }

    this.selectAlternativeRestriction = selectionSettings.selectAlternativeRestriction;
    this.enableRetry = h5pConfigData.behaviour.enableRetry;
    this.enableSolutionsButton = h5pConfigData.behaviour.enableSolutionsButton;
    this.enableCheckButton = h5pConfigData.behaviour.enableCheckButton;
    this.autoCheck = h5pConfigData.behaviour.autoCheck;
    this.caseSensitive = typingSettings.caseSensitive;
    this.warnSpellingErrors = typingSettings.spellingErrorBehaviour === 'warn';
    this.acceptSpellingErrors = typingSettings.spellingErrorBehaviour === 'accept';
    this.showSolutionsRequiresInput = h5pConfigData.behaviour.showSolutionsRequiresInput;
    this.confirmCheckDialog = h5pConfigData.behaviour.confirmCheckDialog;
    this.confirmRetryDialog = h5pConfigData.behaviour.confirmRetryDialog;
    this.disableImageZooming = h5pConfigData.media?.disableImageZooming ?? false;
    this.randomAnswers = selectionSettings.randomAnswers;
  }

  /**
   * Return copy of settings with logic for given cloze type enforced.
   * @param {ClozeType} clozeType Cloze type of the blank.
   * @returns {ISettings} Settings for the cloze type.
   */
  public getSettingsForClozeType(clozeType: ClozeType): ISettings {
    const settings: H5PSettings = Object.assign(Object.create(H5PSettings.prototype), this);
    settings.clozeType = clozeType;
    settings.enforceLogic();

    return settings;
  }

  /**
   * Set sensible default values for settings not relevant for the cloze type.
   */
  private enforceLogic(): void {
    if (this.clozeType === ClozeType.Type || this.clozeType === ClozeType.Number) {
      this.selectAlternatives = SelectAlternatives.All;
      this.selectAlternativeRestriction = 0;

      // Numbers always need to match exactly
      if (this.clozeType === ClozeType.Number) {
        this.warnSpellingErrors = false;
        this.acceptSpellingErrors = false;
        this.caseSensitive = false;
      }
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
