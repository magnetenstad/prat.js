import { Prat } from '../src';

describe('Prat', () => {
  test('Hello world!', () => {
    const prat = Prat.fromString(`
Hello world!
`);
    expect(prat.getText()).toBe('Hello world!');
  });

  test('Choices', () => {
    const prat = Prat.fromString(`
Hello 1
Hello 2
\tResponse 1
\tResponse 2
Hello 3
\tResponse 3
\tResponse 4
>{start}
`);
    expect(prat.getText()).toBe('Hello 1');
    expect(prat.getChoiceTexts().length).toBe(0);
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
    expect(prat.getChoiceTexts()[0]).toBe('Response 1');
    expect(prat.getChoiceTexts()[1]).toBe('Response 2');
    prat.input();
    expect(prat.getText()).toBe('Response 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 3');
    expect(prat.getChoiceTexts()[0]).toBe('Response 3');
    expect(prat.getChoiceTexts()[1]).toBe('Response 4');
    prat.input(1);
    expect(prat.getText()).toBe('Response 4');
  });

  test('Choices, goto', () => {
    const prat = Prat.fromString(`
Hello 1
\tResponse 1
\t\tHello 1.1
\t\t\tResponse 1.1
\tResponse 2
\t\tHello 1.2
Hello 2
>{start}
`);
    expect(prat.getText()).toBe('Hello 1');
    prat.input();
    expect(prat.getText()).toBe('Response 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 1.1');
    prat.input();
    expect(prat.getText()).toBe('Response 1.1');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
  });

  test('Conditions', () => {
    const prat = Prat.fromString(`
Hello 1
Hello 2 ?{false}
Hello 3
`);
    expect(prat.getText()).toBe('Hello 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 3');
  });

  test('Actions, global scope', () => {
    const prat = Prat.fromString(`
Hello 1 !{$g.x = false}
Hello 2 ?{$g.x}
Hello 3 ?{!$g.x}
Hello 4 !{$g.x = true}
Hello 5 ?{$g.x}
Hello 6 ?{!$g.x}
`);
    expect(prat.getText()).toBe('Hello 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 3');
    prat.input();
    expect(prat.getText()).toBe('Hello 4');
    prat.input();
    expect(prat.getText()).toBe('Hello 5');
  });

  test('Actions, local scope', () => {
    const prat = Prat.fromString(`
#{start}
Hello 1 !!{$l.show = true} ?{$l.show} !{$l.show = false}
Hello 2
Hello 3 !!{$l.show = true} ?{$l.show} !{$l.show = false}
>{start}
`);
    expect(prat.getText()).toBe('Hello 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
    prat.input();
    expect(prat.getText()).toBe('Hello 3');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
  });

  test('Inheritance', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{$l.show = true} ?{$l.show} !{$l.show = false}

#{start}
Hello 1 +{showOnce}
Hello 2
Hello 3 +{showOnce}
>{start}
`);
    expect(prat.getText()).toBe('Hello 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
    prat.input();
    expect(prat.getText()).toBe('Hello 3');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
  });

  test('Inheritance on choice', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{$l.show = true} ?{$l.show} !{$l.show = false}

#{start}
Hello 1
\tResponse 1 +{showOnce}
\tResponse 2 +{showOnce}
Hello 2
>{start}
`);
    expect(prat.getText()).toBe('Hello 1');
    expect(prat.getChoiceTexts().length).toBe(2);
    expect(prat.getChoiceTexts()[0]).toBe('Response 1');
    expect(prat.getChoiceTexts()[1]).toBe('Response 2');
    prat.input();
    expect(prat.getText()).toBe('Response 1');
    prat.input();
    prat.input();
    expect(prat.getText()).toBe('Hello 1');
    expect(prat.getChoiceTexts().length).toBe(1);
    expect(prat.getChoiceTexts()[0]).toBe('Response 2');
    prat.input(1);
    expect(prat.getText()).toBe('Response 2');
    prat.input();
    prat.input();
    expect(prat.getText()).toBe('Hello 1');
    expect(prat.getChoiceTexts().length).toBe(0);
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
  });

  test('Skip default choice', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{$l.show = true} ?{$l.show} !{$l.show = false}
#{skipDefaultChoice} ?{$l.instance.getChoices($g.instance).length > 1}
#{start}
Hello 1 +{skipDefaultChoice} >{end}
\tResponse 1 +{showOnce}
\tDefault >{end}
>{start}
#{end}
Hello 2
`);
    expect(prat.getText()).toBe('Hello 1');
    prat.input();
    expect(prat.getText()).toBe('Response 1');
    prat.input();
    expect(prat.getText()).toBe('Hello 2');
  });

  test('Insertions', () => {
    const prat = Prat.fromString(`
#{start} Hello \${$g.a}! !!{$g.a = 0} !{$g.a++} >{start}
`);
    expect(prat.getText()).toBe('Hello 1!');
    prat.input();
    expect(prat.getText()).toBe('Hello 2!');
    prat.input();
    expect(prat.getText()).toBe('Hello 3!');
  });
});
