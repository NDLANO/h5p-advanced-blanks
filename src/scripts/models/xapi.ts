/** XAPI activity definition structure for reporting interaction results. */
export class XAPIActivityDefinition {
  /** Activity name identifier. */
  name: any;

  /** Activity description. */
  description: any;

  /** Type of activity. */
  type: string;

  /** Type of interaction (e.g., fill-in, choice). */
  interactionType:
    'true-false' | 'choice' | 'fill-in' | 'long-fill-in' | 'matching' |
    'performance' | 'sequencing' | 'likert' | 'numeric' | 'other';

  /** Allowed correct response patterns. */
  correctResponsesPattern?: string[];

  /** Extension data for custom properties. */
  extensions: any;
}
