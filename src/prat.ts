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
  responses: string[];
  condition: string;
  prepare: string;
  action: string;
  inherit: string;
  comment: string;
  context: { instance: PratLine } = { instance: this };
  prat: Prat | null = null;

  constructor(
    key: string,
    text: string,
    author: string,
    goto: string,
    responses: string[],
    condition: string,
    prepare: string,
    action: string,
    inherit: string,
    comment: string
  ) {
    this.key = key;
    this.text = text;
    this.author = author;
    this.goto = goto;
    this.responses = responses;
    this.condition = condition;
    this.prepare = prepare;
    this.action = action;
    this.inherit = inherit;
    this.comment = comment;
  }

  get() {
    if (!this.prat) {
      throw new Error(`Line has not been initialized with a Prat ${this}`);
    }
    return this.prat.getFromKey(this.key);
  }

  resetContext() {
    if (!this.prat) {
      throw new Error(`Line has not been initialized with a Prat ${this}`);
    }
    for (const prop of Object.getOwnPropertyNames(this.context)) {
      //@ts-ignore
      delete this.context[prop];
    }
    this.context.instance = this;
    this.prat.pushLine(this);
  }

  apply(line: PratLine | undefined | null): void {
    if (!line) return;
    if (!this.text) this.text = line.text;
    if (!this.author) this.author = line.author;
    if (!this.goto) this.goto = line.goto;
    if (!this.condition) this.condition = line.condition;
    if (!this.prepare) this.prepare = line.prepare;
    if (!this.action) this.action = line.action;
  }
}

export class Prat {
  private lines: Map<string, PratLine> = new Map();
  private key: string = '';
  private context = { global: { instance: this }, local: {} };
  private onEndCallback: () => void = () => null;
  private ended = false;

  constructor(lines: PratLine[]) {
    lines.forEach((line) => this.pushLine(line));
    this.setKey(lines[0].key);
  }

  private getEmpty() {
    return {
      statement: 'undefined',
      responses: [],
      author: '',
    };
  }

  get() {
    return this.getLine()?.get() ?? this.getEmpty();
  }

  getFromKey(key: string) {
    const line = this.lines.get(key);
    return line
      ? {
          statement: this.getTextOf(line),
          responses: this.getResponsesOf(line).map((line) =>
            this.getTextOf(line)
          ),
          author: line.author,
        }
      : this.getEmpty();
  }

  print(callback: (result: string) => void = console.log): Prat {
    const state = this.get();
    const output =
      (state.author ? `${state.author}:` : '') +
      (state.statement +
        '\n' +
        state.responses.map((res, i) => `\t(${i}) ${res}`));

    callback(output);
    return this;
  }

  respond(responseIndex?: string | number): Prat {
    const linePrev = this.getLine();
    if (this.ended || !linePrev) return this;

    const responses = this.getResponsesOf(linePrev);
    if (responses.length > 0) {
      responseIndex = responseIndex ?? 0;
      try {
        if (typeof responseIndex === 'string') {
          responseIndex = parseInt(responseIndex);
        }
        this.setKey(responses[responseIndex].key);
      } catch {
        this.setKey(responses[0].key);
      }
    } else {
      this.setKey(linePrev.goto);
    }
    return this;
  }

  pushLine(line: PratLine): Prat {
    line.prat = this;
    this.lines.set(line.key, line);

    if (line.inherit) {
      line.apply(this.lines.get(line.inherit));
    }
    if (line.prepare) {
      this.evalJavascript(line.prepare, line);
    }
    return this;
  }

  onEnd(callback: () => void): Prat {
    this.onEndCallback = callback;
    return this;
  }

  hasEnded() {
    return this.ended;
  }

  resetContext(): Prat {
    for (const prop of Object.getOwnPropertyNames(this.context.global)) {
      //@ts-ignore
      delete this.context.global[prop];
    }
    for (const prop of Object.getOwnPropertyNames(this.context.local)) {
      //@ts-ignore
      delete this.context.local[prop];
    }
    this.context.global.instance = this;
    [...this.lines].forEach(([_key, line]) => line.resetContext());

    return this;
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

    let authorPrev = '';
    const pratLines: PratLine[] = [];
    lines.forEach((line, i) => {
      const responses: string[] = [];

      let goto = '';

      const tabsI = prefixCount(line, '\t');
      if (tabsI % 2 == 0) {
        // is a statement
        let tabsMin = tabsI;
        for (let j = i + 1; j < lines.length; j++) {
          const tabsJ = prefixCount(lines[j], '\t');
          tabsMin = Math.min(tabsJ, tabsMin);
          if (tabsJ <= tabsMin && tabsJ % 2 == 0) {
            goto = extractKey(lines[j]);
            break;
          }
          if (tabsJ == tabsI + 1 && tabsI == tabsMin) {
            responses.push(extractKey(lines[j]));
          }
        }
      } else {
        // is a response
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
      const prepare = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.action);
      const action = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.inherit);
      const inherit = extraction.extraction;
      extraction = extractAttribute(extraction.rest, PratSymbol.comment);
      const comment = extraction.extraction;

      pratLines.push(
        new PratLine(
          key,
          extraction.rest.trim(),
          author,
          goto,
          responses,
          condition,
          prepare,
          action,
          inherit,
          comment
        )
      );
      authorPrev = author;
    });

    return new Prat(pratLines);
  }

  private getLine(): PratLine | null {
    return this.lines.get(this.key) ?? null;
  }

  private getTextOf(line: PratLine) {
    let text = line.text;
    const symbol = PratSymbol.insert + PratSymbol.left;
    while (text.includes(symbol)) {
      text = extract(text, symbol, PratSymbol.right, (js) =>
        this.evalJavascript(js, line)
      ).rest;
    }
    return text;
  }

  private getResponsesOf(line: PratLine): PratLine[] {
    const responses = [...this.lines.values()].filter((l) =>
      line.responses.includes(l.key)
    );
    for (let i = 0; i < responses.length; i++) {
      if (
        responses[i].condition &&
        !this.evalJavascript(responses[i].condition, responses[i])
      ) {
        responses.splice(i--, 1);
      }
    }
    return responses;
  }

  private setKey(key: string): void {
    this.ended = false;
    this.key = key;
    const line = this.lines.get(this.key);
    if (!line) {
      if (!key) {
        this.onEndCallback();
        this.ended = true;
      } else {
        console.warn(`Invalid key <${this.key}>.`);
      }
      return;
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

  private evalJavascript(javascript: string, line: PratLine): any {
    if (!javascript) return;
    line = line ?? this.getLine();
    this.context.local = line.context;
    const functionString =
      `"use strict"; const $g = this.global; const $l = this.local; ` +
      (javascript.includes(';') ? javascript : `return (${javascript})`);
    return Function(functionString).bind(this.context)();
  }
}
