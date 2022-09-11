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

  test('Actions, global scope', () => {
    const prat = Prat.fromString(`
Hello 1! !{$g.x = false}
Hello 2! ?{$g.x}
Hello 3! ?{!$g.x}
Hello 4! !{$g.x = true}
Hello 5! ?{$g.x}
Hello 6! ?{!$g.x}
`);
    expect(prat.getLine().text).toBe('Hello 1!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 3!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 4!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 5!');
  });

  test('Actions, local scope', () => {
    const prat = Prat.fromString(`
#{start}
Hello 1! !!{$l.show = true} ?{$l.show} !{$l.show = false}
Hello 2!
Hello 3! !!{$l.show = true} ?{$l.show} !{$l.show = false}
>{start}
`);
    expect(prat.getLine().text).toBe('Hello 1!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 2!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 3!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 2!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 2!');
  });

  test('Inheritance', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{$l.show = true} ?{$l.show} !{$l.show = false}

#{start}
Hello 1! +{showOnce}
Hello 2!
Hello 3! +{showOnce}
>{start}
`);
    expect(prat.getLine().text).toBe('Hello 1!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 2!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 3!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 2!');
    prat.input();
    expect(prat.getLine().text).toBe('Hello 2!');
  });
});
