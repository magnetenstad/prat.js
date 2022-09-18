import { Prat } from '../src';

describe('Prat', () => {
  test('Hello world!', () => {
    const prat = Prat.fromString(`
Hello world!
`);
    expect(prat.get().statement).toBe('Hello world!');
  });

  test('Out of range', () => {
    const prat = Prat.fromString(`
Hello 1
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('undefined');
  });

  test('Reponses', () => {
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
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.get().responses.length).toBe(0);
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.get().responses[0]).toBe('Response 1');
    expect(prat.get().responses[1]).toBe('Response 2');
    expect(prat.respond().get().statement).toBe('Response 1');
    expect(prat.respond().get().statement).toBe('Hello 3');
    expect(prat.get().responses[0]).toBe('Response 3');
    expect(prat.get().responses[1]).toBe('Response 4');
    expect(prat.respond(1).get().statement).toBe('Response 4');
  });

  test('Reponses, goto', () => {
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
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Response 1');
    expect(prat.respond().get().statement).toBe('Hello 1.1');
    expect(prat.respond().get().statement).toBe('Response 1.1');
    expect(prat.respond().get().statement).toBe('Hello 2');
  });

  test('Conditions', () => {
    const prat = Prat.fromString(`
Hello 1
Hello 2 ?{false}
Hello 3
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 3');
  });

  test('Actions, global scope', () => {
    const prat = Prat.fromString(`
Hello 1 !{g.x = false}
Hello 2 ?{g.x}
Hello 3 ?{!g.x}
Hello 4 !{g.x = true}
Hello 5 ?{g.x}
Hello 6 ?{!g.x}
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 3');
    expect(prat.respond().get().statement).toBe('Hello 4');
    expect(prat.respond().get().statement).toBe('Hello 5');
  });

  test('Actions, local scope', () => {
    const prat = Prat.fromString(`
#{start}
Hello 1 !!{l.show = true} ?{l.show} !{l.show = false}
Hello 2
Hello 3 !!{l.show = true} ?{l.show} !{l.show = false}
>{start}
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.respond().get().statement).toBe('Hello 3');
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.respond().get().statement).toBe('Hello 2');
  });

  test('Inheritance', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{l.show = true} ?{l.show} !{l.show = false}

#{start}
Hello 1 +{showOnce}
Hello 2
Hello 3 +{showOnce}
>{start}
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.respond().get().statement).toBe('Hello 3');
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.respond().get().statement).toBe('Hello 2');
  });

  test('Inheritance on response', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{l.show = true} ?{l.show} !{l.show = false}

#{start}
Hello 1
\tResponse 1 +{showOnce}
\tResponse 2 +{showOnce}
Hello 2
>{start}
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.get().responses.length).toBe(2);
    expect(prat.get().responses[0]).toBe('Response 1');
    expect(prat.get().responses[1]).toBe('Response 2');
    expect(prat.respond().get().statement).toBe('Response 1');
    expect(prat.respond().respond().get().statement).toBe('Hello 1');
    expect(prat.get().responses.length).toBe(1);
    expect(prat.get().responses[0]).toBe('Response 2');
    expect(prat.respond(1).get().statement).toBe('Response 2');
    expect(prat.respond().respond().get().statement).toBe('Hello 1');
    expect(prat.get().responses.length).toBe(0);
    expect(prat.respond().get().statement).toBe('Hello 2');
  });

  test('Skip default response', () => {
    const prat = Prat.fromString(`
>{start}
#{showOnce} !!{l.show = true} ?{l.show} !{l.show = false}
#{skipDefaultResponse} ?{l.instance.get().responses.length > 1}
#{start}
Hello 1 +{skipDefaultResponse} >{end}
\tResponse 1 +{showOnce}
\tDefault >{end}
>{start}
#{end}
Hello 2
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Response 1');
    expect(prat.respond().get().statement).toBe('Hello 2');
  });

  test('Insertions', () => {
    const prat = Prat.fromString(`
#{start} Hello \${g.a}! !!{g.a = 0} !{g.a++} >{start}
`);
    expect(prat.get().statement).toBe('Hello 1!');
    expect(prat.respond().get().statement).toBe('Hello 2!');
    expect(prat.respond().get().statement).toBe('Hello 3!');
  });

  test('Reset global context', () => {
    const prat = Prat.fromString(`
Hello \${g.a} !!{g.a = 1}
Hello \${g.a} !{g.a++}
!{g.instance.resetContext()}
Hello \${g.a}
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.respond().get().statement).toBe('Hello 1');
  });

  test('Reset local context', () => {
    const prat = Prat.fromString(`
#{start}
Hello \${l.a} !!{l.a = 0} !{l.a++;}
Hello \${l.a} !!{l.a = 0} !{l.instance.resetContext(); l.a++;}
>{start}
`);
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 1');
    expect(prat.respond().get().statement).toBe('Hello 2');
    expect(prat.respond().get().statement).toBe('Hello 1');
  });

  test('On complete', () => {
    const prat = Prat.fromString(`
Hello 1
`);
    let x = 0;
    prat.onEnd(() => {
      x++;
    });
    expect(prat.get().statement).toBe('Hello 1');
    expect(prat.hasEnded()).toBe(false);
    expect(x).toBe(0);
    prat.respond();
    expect(x).toBe(1);
    expect(prat.get().statement).toBe('undefined');
    expect(prat.hasEnded()).toBe(true);
    prat.respond();
    expect(x).toBe(1);
    expect(prat.get().statement).toBe('undefined');
    expect(prat.hasEnded()).toBe(true);
  });
});
