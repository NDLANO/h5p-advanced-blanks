/** Localization label enumeration for UI strings. */
export enum LocalizationLabels {
  showSolutionButton = 'showSolutions',
  retryButton = 'tryAgain',
  checkAllButton = 'checkAnswer',
  submitAllButton = 'submitAnswer',
  notFilledOutWarning = 'notFilledOut',
  tipButton = 'tipLabel',
  typoMessage = 'spellingMistakeWarning',
  scoreBarLabel = 'scoreBarLabel',
  a11yCheck = 'a11yCheck',
  a11ySubmitAndCheck = 'a11ySubmitAndCheck',
  a11yShowSolution = 'a11yShowSolution',
  a11yRetry = 'a11yRetry',
  noBlanks = 'noBlanks',
}

/** Localization structure enumeration for complex UI elements. */
export enum LocalizationStructures {
  confirmCheck = 'confirmCheck',
  confirmRetry = 'confirmRetry',
  overallFeedback = 'overallFeedback',
}

/**
 * Provide localization services.
 */
export class H5PLocalization {
  /**
   * Create H5PLocalization instance.
   * @class
   * @param {any} h5pConfiguration H5P configuration object.
   */
  constructor(private h5pConfiguration: any) {
  }

  /**
   * Return localized string represented by identifier.
   * @param {string} localizableStringIdentifier Identifier for localized string.
   * @returns {string} Localized string value.
   */
  private getText(localizableStringIdentifier: string): string {
    return this.h5pConfiguration[localizableStringIdentifier];
  }

  /**
   * Convert localization label to string representation.
   * @param {LocalizationLabels} label Label to convert.
   * @returns {string} String representation of label.
   */
  private labelToString(label: LocalizationLabels): string {
    return label.toString();
  }

  /**
   * Return localized string for label.
   * @param {LocalizationLabels} label Label to look up.
   * @returns {string} Localized string value.
   */
  getTextFromLabel(label: LocalizationLabels): string {
    return this.getText(this.labelToString(label));
  }

  /**
   * Return localized object for structure.
   * @param {LocalizationStructures} structure Structure to look up.
   * @returns {any} Localized object value.
   */
  getObjectForStructure(structure: LocalizationStructures): any {
    return this.h5pConfiguration[structure.toString()];
  }
}
