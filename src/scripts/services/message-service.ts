import { Blank } from '../models/blank';

export class MessageService {
  private speechBubble: any;
  private associatedBlank: Blank;

  constructor(private jQuery: JQueryStatic) {

  }

  public show(elementId: string, message: string, blank: Blank) {
    const elements = this.jQuery("#" + elementId);

    if (elements.length > 0) {
      this.speechBubble = new H5P.JoubelSpeechBubble(elements, message);
      this.associatedBlank = blank;
    }
  }

  public hide() {
    if (this.speechBubble) {
      try {
        this.speechBubble.remove();
      }
      catch {
        // ignore errors when removing the speech bubble
      }
    }
    this.speechBubble = undefined;
    this.associatedBlank = undefined;
  }

  public isActive(blank: Blank) {
    return this.associatedBlank === blank;
  }
}
