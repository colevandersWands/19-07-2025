## Variable Error

Programming languages have strict rules about what you can and cannot do. Here are three
errors you will make quite a bit when you start your own explorations, even a spelling
mistake can cause these errors!

You may get different error messages depending on which browser you are using, but they
mean the same thing. In Debugging we will go much deeper into interpreting and correcting
program errors.

## Not Declaring a Variable

Using a variable that has not been declared will throw an error (when you're in strict
mode, but that's a story for another day. All the exercises in this repo are run in strict
mode).

```js
'use strict';
console.log('-- not declaring 1 --');

// let animal; // uncomment this line to fix the error
animal = 'horse'; // ReferenceError
```

```js
'use strict';
console.log('-- not declaring 2 --');

// a common mistake is spelling your variables incorrectly
let spellingMistake = 'oops!';
console.log(spelingMistake); // ReferenceError
```

## Using a Variable Before it is Declared

```js
'use strict';
console.log('-- using before declaration --');

// read the variable - will throw an error!
console.log(favoriteColor); // ReferenceError

// declare and initialize the variable
let favoriteColor = 'red';

// read the variable
console.log(favoriteColor);
```

## Declaring a Variable Twice

Declaring a variable tells JavaScript to prepare a place in memory with that name. Trying
to create two spaces in memory with the same name will cause an error.

- Chrome & Chromium-based browsers:
  `SyntaxError: Identifier '_' has already been declared`
- Firefox: `SyntaxError: redeclaration of let _`

```js
'use strict';
// ! this log never happens !
//  syntax errors happen before the program runs
//  so no single line of code will happen
//  you will learn more about program life cycle in Debugging
console.log('-- declaring twice --');

let vegetable = 'carrot';
let vegetable = 'potato'; // SyntaxError
// vegetable = 'potato'; // no error
```
