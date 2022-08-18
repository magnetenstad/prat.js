import { TalkSymbol } from './symbol.js';
import {
  Extraction,
  extractAttribute,
  extractKey,
  isEmpty,
  prefixCount,
} from './util.js';

class Line {
  key: string;
  text: string;
  author: string;
  goto: string;
  choices: string[];
  condition: string;
  action: string;
  comment: string;

  constructor(
    key: string,
    text: string,
    author: string,
    goto: string,
    choices: string[],
    condition: string,
    action: string,
    comment: string
  ) {
    this.key = key;
    this.text = text;
    this.author = author;
    this.goto = goto;
    this.choices = choices;
    this.condition = condition;
    this.action = action;
    this.comment = comment;
  }

  toString() {
    return this.author.length > 0 ? this.author + ': ' + this.text : this.text;
  }

  getChoices(talk: Talk) {
    return [...talk.lines.values()].filter((l) => this.choices.includes(l.key));
  }
}

export class Talk {
  lines: Map<string, Line>;
  private key: string;

  constructor(lines: Map<string, Line>, key: string) {
    this.lines = lines;
    this.setKey(key);
    this.key = key;
  }

  static fromString(talk_string: string): Talk {
    talk_string = talk_string.replace('\\\n\t', '\\\n');
    talk_string = talk_string.replace('\\\n', '');
    const lines = talk_string.split('\n').filter((line) => !isEmpty(line));

    // Add key to lines without keys
    lines.forEach((line, i) => {
      if (isEmpty(extractKey(line))) {
        const key_attr =
          TalkSymbol.key +
          TalkSymbol.left +
          TalkSymbol.key +
          i +
          TalkSymbol.right;
        lines[i] = line + key_attr;
      }
    });

    const talkLines = new Map();
    let authorPrev = '';
    lines.forEach((line, i) => {
      const choices: string[] = [];
      let extraction: Extraction;
      extraction = extractAttribute(line, TalkSymbol.goto);
      let goto = extraction.extraction;

      if (isEmpty(goto)) {
        const tabsI = prefixCount(line, '\t');
        if (tabsI % 2 == 0) {
          let tabsMin = tabsI;
          for (let j = i + 1; j < lines.length; j++) {
            const tabsJ = prefixCount(lines[j], '\t');
            tabsMin = Math.min(tabsJ, tabsMin);
            if (tabsJ <= tabsMin) {
              if (choices.length > 0) {
                break;
              }
              if (tabsJ % 2 == 0) {
                goto = extractKey(lines[j]);
                break;
              }
            }
            if (tabsJ == tabsI + 1 && tabsI == tabsMin) {
              choices.push(extractKey(lines[j]));
            }
          }
        } else if (i + 1 < lines.length) {
          goto = extractKey(lines[i + 1]);
        }
      }
      extraction = extractAttribute(extraction.rest, TalkSymbol.key);
      const key = extraction.extraction;
      extraction = extractAttribute(extraction.rest, TalkSymbol.author);
      const author = !isEmpty(extraction.extraction)
        ? extraction.extraction
        : authorPrev;
      extraction = extractAttribute(extraction.rest, TalkSymbol.condition);
      const condition = extraction.extraction;
      extraction = extractAttribute(extraction.rest, TalkSymbol.action);
      const action = extraction.extraction;
      extraction = extractAttribute(extraction.rest, TalkSymbol.comment);
      const comment = extraction.extraction;

      talkLines.set(
        key,
        new Line(
          key,
          extraction.rest.trim(),
          author,
          goto,
          choices,
          condition,
          action,
          comment
        )
      );
      authorPrev = author;
    });

    return new Talk(talkLines, extractKey(lines[0]));
  }

  talk() {
    if (this.key == null) return 'ERROR: Key is null!';
    const line = this.lines.get(this.key);
    if (line == null) return 'ERROR: Invalid key!';

    let result = line.toString() + '\n';
    line.getChoices(this).forEach((choice, i) => {
      result += i + ' ' + choice + '\n';
    });

    return result;
  }

  input(string: string) {
    const line = this.lines.get(this.key);
    if (line == null) return 'ERROR: Invalid key!';
    const choices = line.getChoices(this);
    if (choices.length > 0) {
      try {
        this.setKey(choices[parseInt(string)].goto);
      } catch {
        this.setKey(choices[0].goto);
      }
    } else {
      this.setKey(line.goto);
    }
  }

  setKey(key: string) {
    if (!this.lines.has(key)) {
      throw new Error('Key is not valid!');
    }
    this.key = key;
  }
}
