/** Element type enumeration for cloze components. */
export enum ClozeElementType {
  Blank,
  Highlight
}

/** Base class for cloze elements (blanks and highlights). */
export class ClozeElement {
  /** Type of this cloze element. */
  public type: ClozeElementType;
}
