# Talk / pratjs

## NPM

https://www.npmjs.com/package/pratjs

## Syntax highlighting

VSCode extension for .talk files:
https://github.com/magnetenstad/talkgrammar

## JS Example

```js
import { Prat } from 'pratjs'

const talkFile = ...
const prat = Prat.fromString(talkFile)

console.log(prat.getLine().text) // gets current line content
console.log(prat.getChoices()) // gets current choice lines
prat.input('0') // to select a choice, by index
```

## Example Talk file

```
%{ This is a basic talk file to demonstrate key concepts. }

#{start}
@{Mario} Hello World!
@{World} Hey Mario Brothers, how are you doing? 

	@{Mario} We're doing great. %{ A selectable response to line 5 }
		@{Luigi} Absolutely! 
		@{World} How lovely. %{ Will go to line 17 }

	@{Luigi} Not so great, sir. %{ A selectable response to line 5 }
		@{World} How come? 
		@{Mario} Luigi lost his hat this morning.
		@{World} Well, you can have mine. !{luigi.give(worldHat)}
		@{Luigi} Thanks a bunch! %{ Will go to line 17 }
		
@{World} I hear you have met a girl, Luigi. What is her name?
	
	@{Luigi} I don't want to talk about it.
		@{World} Oh, my apologies.
	
	@{Luigi} Yes, I have. !{name = input()}
		#{sayName}
		@{Luigi} Her name is $name$.
		@{World} I can't wait to meet Alice.
			@{Luigi} Her name is not Alice! !{name = input()}
			@{Luigi} Great..

@{Mario} Well, we better get going.
We'll see you later, World!
?{luigi.has(worldHat)} @{Luigi} And thanks for the hat!
@{World} Goodbye!
>{start} %{ Loops back to start }

This line \
will never \
be reached.
```
