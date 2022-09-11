import { TalkSymbol as PratSymbol } from './symbol';
import {
  Extraction,
  extractAttribute,
  extractKey,
  isEmpty,
  prefixCount,
} from './util';

class Line {
  key: string;
  text: string;
  author: string;
  goto: string;
  choices: string[];
  condition: string;
  initAction: string;
  action: string;
  inherit: string;
  comment: string;
  context = {};

  constructor(
    key: string,
    text: string,
    author: string,
    goto: string,
    choices: string[],
    condition: string,
    initAction: string,
    action: string,
    inherit: string,
    comment: string
  ) {
    this.key = key;
    this.text = text;
    this.author = author;
    this.goto = goto;
    this.choices = choices;
    this.condition = condition;
    this.initAction = initAction;
    this.action = action;
    this.inherit = inherit;
    this.comment = comment;
  }

  toString() {
    return this.author.length > 0 ? this.author + ': ' + this.text : this.text;
  }

  getChoices(talk: Prat) {
    return [...talk.lines.values()].filter((l) => this.choices.includes(l.key));
  }

  apply(line: Line | undefined | null) {
    if (!line) return;
    if (!this.text) this.text = line.text;
    if (!this.author) this.author = line.author;
    if (!this.goto) this.goto = line.goto;
    if (!this.choices) this.choices = line.choices;
    if (!this.condition) this.condition = line.condition;
    if (!this.initAction) this.initAction = line.initAction;
    if (!this.action) this.action = line.action;
    if (!this.inherit) this.inherit = line.inherit;
    if (!this.comment) this.comment = line.comment;
  }
}

export class Prat {
  lines: Map<string, Line>;
  private key: string = '';
  private context = { global: {}, local: {} };

  constructor(lines: Map<string, Line>, key: string) {
    this.lines = lines;
    this.lines.forEach((line) => {
      if (line.inherit) {
        line.apply(this.lines.get(line.inherit));
      }
      if (line.initAction) {
        this.evalJavascript(line.initAction, line);
      }
    });
    this.setKey(key);
  }

  static fromString(talk_string: string): Prat {
    talk_string = talk_string.replace('\\\n\t', '\\\n');
    talk_string = talk_string.replace('\\\n', '');
    const lines = talk_string.split('\n').filter((line) => !isEmpty(line));

    // Add key to lines without keys
    lines.forEach((line, i) => {
      if (isEmpty(extractKey(line))) {
        const key_attr =
          PratSymbol.key +
          PratSymbol.left +
          PratSymbol.key +
          i +
          PratSymbol.right;
        lines[i] = line + key_attr;
      }
    });

    const talkLines = new Map();
    let authorPrev = '';
    lines.forEach((line, i) => {
      const choices: string[] = [];
      let extraction: Extraction;
      extraction = extractAttribute(line, PratSymbol.goto);
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
      extraction = extractAttribute(extraction.rest, PratSymbol.key);
      const key = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.author);
      const author = !isEmpty(extraction.extraction)
        ? extraction.extraction
        : authorPrev;
      extraction = extractAttribute(extraction.rest, PratSymbol.condition);
      const condition = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.initAction);
      const initAction = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.action);
      const action = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.inherit);
      const inherit = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.comment);
      const comment = extraction.extraction;

      const lineInst = new Line(
        key,
        extraction.rest.trim(),
        author,
        goto,
        choices,
        condition,
        initAction,
        action,
        inherit,
        comment
      );
      talkLines.set(key, lineInst);
      authorPrev = author;
    });

    const prat = new Prat(talkLines, extractKey(lines[0]));
    return prat;
  }

  getLine(): Line {
    let line = this.lines.get(this.key);
    if (line == null) throw new Error(`Invalid key <${this.key}>.`);
    return line;
  }

  getChoices(): Line[] {
    return this.getLine().getChoices(this);
  }

  getLineAndChoices(): string {
    const line = this.getLine();
    let result = line.toString() + '\n';
    line.getChoices(this).forEach((choice, i) => {
      result += i + ' ' + choice + '\n';
    });
    return result;
  }

  input(choiceIndex?: string | number) {
    const linePrev = this.getLine();

    const choices = linePrev.getChoices(this);
    if (choices.length > 0) {
      choiceIndex = choiceIndex ?? 0;
      try {
        if (typeof choiceIndex === 'string') {
          choiceIndex = parseInt(choiceIndex);
        }
        this.setKey(choices[choiceIndex].key);
      } catch {
        this.setKey(choices[0].key);
      }
    } else {
      this.setKey(linePrev.goto);
    }
  }

  evalJavascript(javascript: string, line?: Line) {
    if (!javascript) return;
    line = line ?? this.getLine();
    this.context.local = line.context;
    const fn = Function(
      `"use strict"; const $g = this.global; const $l = this.local; return (${javascript})`
    );
    const result = fn.bind(this.context)();
    // console.log(line.key, '|', javascript, '|', result);
    return result;
  }

  setKey(key: string) {
    this.key = key;
    const line = this.lines.get(this.key);
    if (!line) {
      throw new Error(`Invalid key <${this.key}>.`);
    }
    if (
      isEmpty(line.text) ||
      (line.condition && !this.evalJavascript(line.condition, line))
    ) {
      this.setKey(line.goto);
      return;
    }
    this.evalJavascript(line.action, line);
  }
}
