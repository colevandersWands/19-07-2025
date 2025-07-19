# Variable Names

The computer cannot understand what your variable names _mean_, to a computer
`let asdf = 'hello';` is same as `let greeting = 'hello';` . Variable names are 100% for
developers to understand the code and 0% helpful for the computer.

Computers just care how you _use_ the variables:

- Where is it declared?
- Is it initialized?
- Where is it read?
- Where is it assigned a new value?

When the computer is interpreting your code it's these "patterns" that make one set of
instructions different from another, not the variable names.

Consider these two programs, they both have different variable names but the same
instructions. Commented above each line is how the computer will interpret your code (or
close enough for now). Can you find anything different between the comments in each
program?

---

```js
'use strict';

console.log('--- program 1 --- ');

// declare variable 1: let
// initialize variable 1: "hello"
let greeting = 'hello';

// declare variable 2: let
// initialize variable 2: "!"
let excitement = '!';

// read from variable 1: "hello"
// read from variable 2: "!"
// assign to variable 1: "hello!"
greeting = greeting + excitement;

// read from variable 1: "hello!"
console.log(greeting);
```

---

```js
'use strict';

console.log('--- program 2 --- ');

// declare variable 1: let
// initialize variable 1: "hello"
let x = 'hello';

// declare variable 2: let
// initialize variable 2: "!"
let y = '!';

// read from variable 1: "hello"
// read from variable 2: "!"
// assign to variable 1: "hello!"
x = x + y;

// read from variable 1: "hello!"
console.log(x);
```

<details>
<summary>🥚 variable names <strong>can</strong> use numbers, letters, $, or _</summary>

```js
'use strict';
console.log('-- valid variable names --');
// all of these variable names are ok

let $ = 1;
let _ = 2;
let a = 3;
let A = 4;
let b1_$ = 5;
let HackYourFuture2021_$ = 6;
let b_e_l_g_i_u_m = 7;
// ...
```

</details>
<details>
<summary>🥚 variable names <strong>are</strong> case-sensitive</summary>

```js
'use strict';
console.log('-- variable names are case-sensitive --');

// notice, there is no error.
//  JS does not consider this as declaring the same variable twice
let javascript = 'a programming language';
let JavaScript = 'upper case!';

console.log(javascript); // 'a programming language'
console.log(JavaScript); // 'upper case!'
```

</details>
<details>
<summary>🥚 variable names can <strong>not</strong> start with a number</summary>

```js
'use strict';
console.log('-- variable names cannot start with a number --')

let a1 = 'this works';

let 1a = 'will throw an error';
```

</details>
<details>
<summary>🥚 variable names can not use any other characters</summary>

```js
'use strict';
let a*a = 'will throw an error';
```

```js
'use strict';
let a-b-c = 'will throw an error';
```

```js
'use strict';
let @hyf = 'will throw an error';
```

```js
'use strict';
// spaces count as other characters
let hack your future = 'will throw an error';
```

</details>
<details>
<summary>🥚 variable names can not be <strong>reserved words</strong></summary>
<br>

In JavaScript there are some words that you cannot use as variable names. These are called
_Reserved Words_. Some of them are words which carry special meaning in JS like `let` or
`null`. Other reserved words don't have any special meaning yet, but may in the future.

```js
'use strict';
let var = 'will throw an error';
```

```js
'use strict';
let null = 'will throw an error';
```

```js
'use strict';
let function = 'will throw an error';
```

```js
'use strict';
let public = 'will throw an error';
```

all the reserved works, in a list:

- [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#keywords)
- [w3schools](https://www.w3schools.com/js/js_reserved.asp)

</details>

### Good Variable Names

Just because a variable name doesn't throw an error doesn't mean it's a good name.

A good variable name is easy to read and helps you understand what the program does. You
will learn more about how to choose good variable names in Debugging. For now take a look
at these two programs with the same logic. see how good names help, and bad names can be
confusing:

<details>
<summary>🐣 confusing variable names</summary>

```js
'use strict';
let thisThing = 'hello';
let thatThing = '';

for (let oneThing of thisThing) {
  thatThing = oneThing + thatThing;
}

console.log(thatThing); // 'olleh'
```

</details>

<details>
<summary>🐣 helpful variable names</summary>

```js
'use strict';
let forwards = 'hello';
let backwards = '';

for (let nextLetter of forwards) {
  backwards = nextLetter + backwards;
}

console.log(backwards); // 'olleh'
```

</details>

### Built-in Variables

Some variables already come with JavaScript, you do not need to declare them to use them.
Think of `console` - you didn't write that variable but you use it all the time.

These a not the same as reserved words, you can use declare or reassign them! Declaring
built-in variables will almost always cause problems in your programs because you
_over-write_ the value that was stored before. There are some advanced use-cases when this
is helpful, but you won't learn about those at HYF.

Here are some examples of using built-in variable names in your programs. These are just
examples, not suggestions ;)

<details>
<summary>🐥 assigning to a built-in variable</summary>

```js
'use strict';
// this log will work because console has not been reassigned
console.log('-- assigning to console --');

console = 'hello';

// see? it's a string!
alert(console);

// this log will not work, console now stores a string
console.log('will throw an error');
```

</details>
<details>
<summary>🐥 declaring a built-in name</summary>

```js
'use strict';
console.log('-- declaring a variable named alert 1 --');

// this will not work!
//  JS treats this like using a variable before it's declaration
alert('huh?'); // ReferenceError - use before declare

let alert = 'hello';

console.log(alert);
```

```js
'use strict';
console.log('-- declaring a variable named alert 2 --');

let alert = 'hello';

console.log(alert);

alert('will throw an error'); // TypeError - not a function
```

</details>

## References

- [javascript.info](https://javascript.info/variables#variable-naming)
- [nexTRIE](https://www.youtube.com/watch?v=O5WlRR-lEDE)
- [launchcode](https://education.launchcode.org/intro-to-web-dev-curriculum/data-and-variables/reading/more-on-variables/index.html#naming-variables)
