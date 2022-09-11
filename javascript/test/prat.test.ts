import { Prat } from '../src';

describe('Prat', () => {
  test('Hello world!', () => {
    const prat = Prat.fromString(`
Hello world!
`);
    expect(prat.getLine().text).toBe('Hello world!');
  });

  test('Conditions', () => {
    const prat = Prat.fromString(`
Hello 1!
Hello 2! ?{false}
Hello 3!
`);
    expect(prat.getLine().text).toBe('Hello 1!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 3!');
  });

  test('Actions', () => {
    const prat = Prat.fromString(`
Hello 1! !{$.x = false}
Hello 2! ?{$.x}
Hello 3! ?{!$.x}
Hello 4! !{$.x = true}
Hello 5! ?{$.x}
Hello 6! ?{!$.x}
`);
    expect(prat.getLine().text).toBe('Hello 1!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 3!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 4!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 5!');
  });
});
