import { TalkSymbol } from './symbol.js';

export interface Extraction {
  extraction: string;
  rest: string;
}

export const prefixCount = (string: string, prefix: string) => {
  let i = 0;
  while (string[i] == prefix) {
    i += 1;
  }
  return i;
};

export const extract = (
  string: string,
  startSymbol: string,
  endSymbol: string
): Extraction => {
  if (!string.includes(startSymbol) && string.includes(endSymbol)) {
    return { extraction: '', rest: string };
  }

  let start = string.indexOf(startSymbol) + startSymbol.length;
  let end = -1;
  let depth = 0;

  for (let i = start; i < string.length; i++) {
    const s = string.substring(i);
    if (!depth && s.startsWith(endSymbol)) {
      end = i;
      break;
    }
    depth += s.startsWith(TalkSymbol.left) ? 1 : 0;
    depth -= s.startsWith(TalkSymbol.right) ? 1 : 0;
  }

  if (end === -1) {
    return { extraction: '', rest: string };
  }

  const extraction = string.substring(start, end);
  return {
    extraction: extraction,
    rest: string.replace(startSymbol + extraction + endSymbol, ''),
  };
};

export const extractAttribute = (string: string, symbol: string) => {
  return extract(string, symbol + TalkSymbol.left, TalkSymbol.right);
};

export const extractKey = (string: string) => {
  return extractAttribute(string, TalkSymbol.key).extraction;
};

export const isEmpty = (str: string | null | undefined) => {
  return str === undefined || str === null || str.trim() === '';
};
