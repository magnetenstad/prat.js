# PratJS

Prat is a dialog system. PratJS is in interpreter of Prat, for the web.

## Getting started

```sh
npm i pratjs
```

## Syntax highlighting

[Prat](https://marketplace.visualstudio.com/items?itemName=magneet.prat) is the official VSCode extension for Prat.

## Demos

- [magne.dev/chat](https://magne.dev/chat)

## Usage

```js
import { Prat } from 'pratjs';

const pratString = `
Hello World!
`;
const prat = Prat.fromString(pratString);

console.log(prat.getText()); // gets current line content
console.log(prat.getChoiceTexts()); // gets current choice lines
prat.input(0); // to select a choice, by index
```

## Example Prat file

```prat
%{ This is a basic Prat file to demonstrate key concepts. }

#{start}
@{Mario} Hello World!
@{World} Hey Mario Brothers, how are you doing?

	@{Mario} We're doing great. %{ A selectable response to line 5 }
		@{Luigi} Absolutely!
		@{World} How lovely. %{ Will go to 'World: I hear you..' }

	@{Luigi} Not so great, sir. %{ A selectable response to line 5 }
		@{World} How come?
		@{Mario} Luigi lost his hat this morning.
		@{World} Well, you can have mine. !{$g.hat = 'worldHat'}
		@{Luigi} Thanks a bunch! %{ Will go to 'World: I hear you..' }

@{World} I hear you have met someone, Luigi. What is their name?

	@{Luigi} I don't want to talk about it.
		@{World} My apologies.

	@{Luigi} Yes, I have.
		@{World} And their name is?
			@{Luigi} Tom !{$g.name = 'Tom'}
			@{Luigi} Lisa !{$g.name = 'Lisa'}
		@{World} I can't wait to meet ${$g.name}.

@{Mario} Well, we better get going.
We'll see you later, World!
?{$g.hat} @{Luigi} And thanks for the hat!
@{World} Goodbye!
>{start} %{ Loops back to start }

This line \
will never \
be reached.
```
