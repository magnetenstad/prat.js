<div align="center">
    <img src="assets/prat.svg"
        width="400"
        alt="Logo."/>
</div>

# PratJS

Prat is a dialog system. PratJS is in interpreter of Prat, for the web.

## Installation

```sh
npm i pratjs
```

## Syntax highlighting

[Prat](https://marketplace.visualstudio.com/items?itemName=magneet.prat) is the official VSCode extension for Prat.

## Demos

- [magne.dev/chat](https://magne.dev/chat)

## Basic usage

```js
import { Prat } from 'pratjs';

const pratString = `
Hello, this is Prat!
\tHey, Prat!
\t\tIt's nice to meet you.
\tWhat is Prat?
\t\tPrat is a dialog system with some cool features.
`;

const prat = Prat.fromString(pratString);

prat.get();
/*
{
  statement: 'Hello, this is Prat!'
  responses: ['Hey, Prat!', 'What is Prat?']
  author: ''
}
*/
prat.print();
/*
Hello, this is Prat!
  (0) Hey, Prat!
  (1) What is Prat?
*/
prat.respond(1);
prat.print();
/*
Prat is a dialog system with some cool features.
*/
```

More examples may be seen below or in the [tests](test/prat.test.ts).

## API

```js
class Prat {
  static fromString(pratString: string): Prat;
  get(): {
      statement: string;
      responses: string[];
      author: string;
  };
  print(callback?: (result: string) => void): void;
  respond(responseIndex?: string | number): void;
}
```

## Prat docs

A Prat consists of statements and responses. A statement may lead to multiple selectable responses, but a response may only lead to one statement. An even number of tabs indicates a statement, and an odd number of tabs indicates a response.

```
This is a statement.
	This is a response.
		This statement will follow the first response.
	This is another response.
		This statement will follow the second response.
This statement will follow regardless of what response was selected.
```

### Extensions

Any line may be extended by the following extensions. They are all on the form `<symbol>{<content>}`. The placement of an extension within a line does not matter (except for [insertions](#insert-javascript)). However, the convention is to place key and author symbols at the beginning and the rest at the end.

```js
class PratSymbol {
  key = '#';
  goto = '>';
  author = '@';
  prepare = '!!';
  action = '!';
  condition = '?';
  insert = '$';
  comment = '%';
  inherit = '+';
  left = '{';
  right = '}';
}
```

#### Key: `#{key}`

By default, all lines are are assigned a `#<line number>` as their key. This may be overridden with the key symbol.

```prat
#{main} The key of this line is 'main'
```

#### Goto: `>{key}`

By default, all lines lead to the following line. This may be changed with the goto symbol.

```prat
#{start}
This is an infinite loop.
>{start}
```

#### Author: `@{author}`

The author symbol is used to assign an author to the line. The author may be accessed with `prat.get().author`

```prat
@{Magne} The author of this line is 'Magne'
```

#### Prepare: `!!{javascript}`

The prepare symbol is used to run code at talk initialization. This is useful to initialize variables. `$g` indicates global [context](#context).

```prat
Let's initialize a global variable !!{$g.shouldSkipLine = true}
```

#### Action: `!{javascript}`

The action symbol is used to run code when a line is reached. This is useful to update variables.

```prat
Let's toggle this variable !{$g.shouldSkipLine = !$g.shouldSkipLine}
```

#### Condition: `?{javascript}`

With the condition symbol, one may set conditions to when the line show be shown or skipped.

```prat
?{$g.shouldShowLine} This line is skipped if the local variable 'shouldShowLine' is false.
```

#### Insert: `${javascript}`

With insertions, one may include dynamic content in a line.

```prat
!!{$g.age = 21}
My age is ${$g.age}.
```

#### Comment: `%{comment}`

```prat
This is part of the Prat %{but this will not be included.}
```

#### Inherit: `+{key}`

With the inherit symbol, a line may use extensions from another line. This is useful to prevent copying and pasting.

```prat
>{start}

%{Declarations}
#{showOnce} !!{$l.show = true} ?{$l.show} !{$l.show = false}

#{start}
Hello.
These lines will be shown in every loop.
But this line will only be shown in the first loop. +{showOnce}
These lines will be shown in every loop.
>{start}
```

### Context

Variables should be assigned to global (`$g`) or local (`$l`) context. Global variables are accessible from the whole talk, while local variables are local to a single line. You may also access the Prat and PratLine instances from the talk with `$g.instance` and `$l.instance`, but this is highly experimental.
