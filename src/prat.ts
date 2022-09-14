import { PratSymbol } from './symbol';
import {
  Extraction,
  extractAttribute,
  extractKey,
  isEmpty,
  prefixCount,
  extract,
} from './util';

class PratLine {
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
  context: { instance: PratLine } = { instance: this };

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

  getChoices(prat: Prat): PratLine[] {
    const choices = [...prat.lines.values()].filter((l) =>
      this.choices.includes(l.key)
    );
    for (let i = 0; i < choices.length; i++) {
      if (
        choices[i].condition &&
        !prat.evalJavascript(choices[i].condition, choices[i])
      ) {
        choices.splice(i--, 1);
      }
    }
    return choices;
  }

  getText(prat: Prat): string {
    let text = this.text;
    const symbol = PratSymbol.insert + PratSymbol.left;
    while (text.includes(symbol)) {
      text = extract(text, symbol, PratSymbol.right, (js) =>
        prat.evalJavascript(js, this)
      ).rest;
    }
    return text;
  }

  apply(line: PratLine | undefined | null): void {
    if (!line) return;
    if (!this.text) this.text = line.text;
    if (!this.author) this.author = line.author;
    if (!this.goto) this.goto = line.goto;
    if (!this.condition) this.condition = line.condition;
    if (!this.initAction) this.initAction = line.initAction;
    if (!this.action) this.action = line.action;
    if (!this.inherit) this.inherit = line.inherit;
    if (!this.comment) this.comment = line.comment;
  }
}

export class Prat {
  lines: Map<string, PratLine>;
  private key: string = '';
  private context = { global: { instance: this }, local: {} };

  constructor(lines: Map<string, PratLine>, key: string) {
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

  static fromString(pratString: string): Prat {
    pratString = pratString.replace('\\\n\t', '\\\n');
    pratString = pratString.replace('\\\n', '');
    const lines = pratString.split('\n').filter((line) => !isEmpty(line));

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

    const pratLines = new Map();
    let authorPrev = '';
    lines.forEach((line, i) => {
      const choices: string[] = [];

      let goto = '';

      const tabsI = prefixCount(line, '\t');
      if (tabsI % 2 == 0) {
        // is not choice
        let tabsMin = tabsI;
        for (let j = i + 1; j < lines.length; j++) {
          const tabsJ = prefixCount(lines[j], '\t');
          tabsMin = Math.min(tabsJ, tabsMin);
          if (tabsJ <= tabsMin && tabsJ % 2 == 0) {
            goto = extractKey(lines[j]);
            break;
          }
          if (tabsJ == tabsI + 1 && tabsI == tabsMin) {
            choices.push(extractKey(lines[j]));
          }
        }
      } else {
        // is choice
        let tabsMin = tabsI;
        for (let j = i + 1; j < lines.length; j++) {
          const tabsJ = prefixCount(lines[j], '\t');
          tabsMin = Math.min(tabsJ, tabsMin);
          if (tabsJ % 2 == 0 && (tabsJ == tabsMin || j == i + 1)) {
            goto = extractKey(lines[j]);
            break;
          }
        }
      }

      let extraction: Extraction;
      extraction = extractAttribute(line, PratSymbol.goto);
      goto = extraction.extraction ? extraction.extraction : goto;
      extraction = extractAttribute(extraction.rest, PratSymbol.key);
      const key = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.author);
      const author = !isEmpty(extraction.extraction)
        ? extraction.extraction
        : authorPrev;
      extraction = extractAttribute(extraction.rest, PratSymbol.condition);
      const condition = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.prepare);
      const initAction = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.action);
      const action = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.inherit);
      const inherit = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.comment);
      const comment = extraction.extraction;

      const pratLine = new PratLine(
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
      pratLines.set(key, pratLine);
      authorPrev = author;
    });

    const prat = new Prat(pratLines, extractKey(lines[0]));
    return prat;
  }

  private getLine(): PratLine {
    let line = this.lines.get(this.key);
    if (line == null) throw new Error(`Invalid key <${this.key}>.`);
    return line;
  }

  getText(): string {
    return this.getLine().getText(this);
  }

  getChoiceTexts(): string[] {
    return this.getLine()
      .getChoices(this)
      .map((line) => line.getText(this));
  }

  getLineAndChoices(): string {
    const line = this.getLine();
    let result = line.toString() + '\n';
    line.getChoices(this).forEach((choice, i) => {
      result += i + ' ' + choice + '\n';
    });
    return result;
  }

  input(choiceIndex?: string | number): void {
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

  evalJavascript(javascript: string, line: PratLine): any {
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

  setKey(key: string): void {
    this.key = key;
    const line = this.lines.get(this.key);
    if (!line) {
      throw new Error(`Invalid key <${this.key}>.`);
    }
    if (line.condition && !this.evalJavascript(line.condition, line)) {
      this.setKey(line.goto);
      return;
    }
    this.evalJavascript(line.action, line);
    if (isEmpty(line.text)) {
      this.setKey(line.goto);
    }
  }
}
