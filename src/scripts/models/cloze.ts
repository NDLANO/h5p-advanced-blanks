import { Highlight } from './highlight';
import { Blank } from './blank';

/**
 * Represent cloze. Instantiate with static createCloze().
 */
export class Cloze {
  /** HTML string representing cloze structure. */
  public html: string;

  /** List of highlights in cloze. */
  public highlights: Highlight[];

  /** List of blanks in cloze. */
  public blanks: Blank[];

  /**
   * Create Cloze instance.
   * @class
   */
  public constructor() { }

  /**
   * Check if all blanks are solved correctly.
   * @returns {boolean} True if all blanks are correct.
   */
  public get isSolved(): boolean {
    return this.blanks.every((b) => b.isCorrect === true);
  }

  /**
   * Hide all highlights in cloze.
   */
  public hideAllHighlights(): void {
    for (const highlight of this.highlights) {
      highlight.isHighlighted = false;
    }
  }

  /**
   * Reset all blanks and hide all highlights.
   */
  public reset(): void {
    this.hideAllHighlights();
    for (const blank of this.blanks) {
      blank.reset();
    }
  }

  /**
   * Show solutions for all blanks and hide highlights.
   */
  public showSolutions(): void {
    for (const blank of this.blanks) {
      blank.showSolution();
    }
    this.hideAllHighlights();
  }

  /**
   * Serialize all blank states to array of strings.
   * @returns {string[]} User-entered text per blank.
   */
  public serialize(): string[] {
    const cloze = [];
    for (const blank of this.blanks) {
      cloze.push(blank.serialize());
    }

    return cloze;
  }

  /**
   * Deserialize blank state from array of data.
   * @param {any} data Data to deserialize.
   */
  public deserialize(data: any): void {
    for (let index = 0; index < data.length; index++) {
      if (index >= this.blanks.length) {
        return;
      }
      const blank = this.blanks[index];
      blank.deserialize(data[index]);
    }
  }
}
