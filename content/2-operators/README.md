# Operators

Operators are what you use to process or change the data in your programs. Operators take
in values, do something, and return a new value. Each operator has it's own rules about
what it does and how it does it. To understand an operator you need to understand these
things:

- **Syntax**: how do you write the operator in your code?
- **Input(s)**: how many inputs does the operator take? what type are they? what are their
  values?
- **Output**: What does the operator evaluate to? What type does it return?
- **Behavior**: How does the operator use it's inputs to create an output?

Here are a few of the operators you will learn about in Welcome to JS, you will learn more
about operators as you need them:

<details>
<summary>🥚 <code>typeof</code> (type of)</summary>

```js
'use strict';
console.log('-> type of: typeof');

/* the typeof operator will tell you the type of a value

  syntax: the typeof operator takes in only one value
    -> typeof _
  inputs: you can pass any value to typeof
  output: a string saying what type the value is
  behavior: typeof returns the name of a value's type
    in Welcome to JS the important types will be:
    -> 'boolean'
    -> 'string'
    -> 'undefined'
    -> 'object' (null, confusing but that's the way it is)
    -> 'number'
*/

console.log(typeof true); // 'boolean'
console.log(typeof 'hello'); // 'string'
console.log(typeof undefined); // 'undefined'
console.log(typeof null); // 'object'
console.log(typeof 12); // 'number'
```

</details>
<details>
<summary>🥚 <code>===</code> (strict equality)</summary>

```js
'use strict';
console.log('-> strict equality: ===');

/* the strict comparison operator will tell you if two primitives are the same

  syntax: the === operator takes in two values
    -> _ === _
  inputs: you can pass any value to ===
  output: a boolean value saying if the two values are the same
  behavior: === checks the type AND the value
    if the types are different, it returns false
    if the values are different, it returns false
    if the type and value are the same, it returns true
*/

// true comparisons: same type, same value
console.log(true === true); // true
console.log(12 === 12); // true
console.log('hello' === 'hello'); // true
console.log(undefined === undefined); // true
console.log(null === null); // true

// false comparisons: same type, different value
console.log(12 === 1); // false
console.log('hello' === 'Hello'); // false
console.log(true === false); // false

// false comparisons: different type, different value
console.log('12' === 12); // false
console.log('undefined' === undefined); // false
console.log(true === 'true'); // false
console.log(100 === 'true'); // false
console.log(true === 1); // false
```

</details>
<details>
<summary>🥚 <code>+</code> (concatenation or addition)</summary>

```js
'use strict';
/*
  the plus operator is more complex
  it behaves differently depending on the types passed in
  it is also called something different depending on the types used
  (but the syntax is always the same)
*/

console.log('-> concatenation: +');

/* string concatenation

  syntax: the + operator takes in two values
    -> _ + _
  inputs: two strings are passed in for concatenation
  output: a new string created by combining the first two
  behavior: when both arguments are a string, they are combined
    'a string' + 'another string'
    becomes
    'a stringanother string'

*/

console.log('hello ' + 'goode bye'); // 'hello good bye'
console.log('hello ' + 'goode ' + 'bye'); // 'hello good bye'

console.log('-> addition: +');
/* number addition

  syntax: the + operator takes in two values
    -> _ + _
  inputs: two numbers are passed in for addition
  output: a new number created by adding both arguments
  behavior: like normal math (for now)
    5 + 3 --> 8
    1 + 1 --> 2
    -1 + -1 --> 0

*/

console.log(5 + 8); // 13
console.log(3 + 3 + 3); // 9
```

</details>

<details>
<summary>🥚 <code>typeof</code></summary>

```js
'use strict';
console.log('-- typeof booleans --');

// they both have the type "boolean"
console.log(typeof true); // 'boolean'
console.log(typeof false); // 'boolean'
```

</details>
<details>
<summary>🥚 <code>===</code> strict equality</summary>

```js
'use strict';
console.log('-- booleans: strict equality --');

// boolean values are only strictly equal to themselves
console.log(true === true); // true
console.log(false === false); // true

// they are not equal to each other
console.log(true === false); // false
console.log(false === true); // false

// booleans are not equal to any other type
console.log(true === 'true'); // false
console.log(false === ''); // false
console.log(true === 12); // false
console.log(false === undefined); // false

console.log('-- numbers: strict equality --');

// are two numbers the same?
console.log(1 === 1.0); // true
console.log(12 === 12); // true
console.log(-3.0 === -3); // true

console.log(1 === 1.1); // false
console.log(-12 === 12); // false
console.log(0.3 === 3.0); // false

// comparing with any other type will always be false
console.log(1 === true); // false
console.log(12 === '12'); // false
console.log(0 === null); // false

console.log('-- strings: strict equality --');

// two strings are the same thing if they have exactly the same characters
console.log('' === ''); // true
console.log('asdf' === 'asdf'); // true
console.log('12D' === '12D'); // true

// two strings with different characters are not the same string
console.log('' === ' '); // false
console.log('asdf' === 'Asdf'); // false
console.log('cow' === 'horse'); // false

// strings are never the same as different types
console.log('' === true); // false
console.log('true' === true); // false
console.log('12' === 12); // false
console.log('null' === null); // false
console.log('hello' === 100); // false
```

</details>
<details>
<summary>🐣 <code>!==</code>  strict inequality</summary>

```js
'use strict';
console.log('-- numbers: strict inequality --');
// this will always be the opposite of strict equality

// are two numbers different?
console.log(1 !== 1.0); // false
console.log(12 !== 12); // false
console.log(-3.0 !== -3); // false

console.log(1 !== 1.1); // true
console.log(-12 !== 12); // true
console.log(0.3 !== 3.0); // true

// comparing with any other type will always be true
console.log(1 !== true); // true
console.log(12 !== '12'); // true
console.log(0 !== null); // true

console.log('-- strings: strict inequality --');
// the opposite of strict equality

// two strings are not unequal if they have exactly the same characters
console.log('' !== ''); // false
console.log('asdf' !== 'asdf'); // false
console.log('12D' !== '12D'); // false

// two strings with different characters are unequal
console.log('' !== ' '); // true
console.log('asdf' !== 'Asdf'); // true
console.log('cow' !== 'horse'); // true

// strings are always unequal to different types
console.log('' !== true); // true
console.log('true' !== true); // true
console.log('12' !== 12); // true
console.log('null' !== null); // true
console.log('hello' !== 100); // true
```

</details>
<details>
<summary>🥚  <code>!</code> not</summary>

```js
'use strict';
console.log('-- not --');

// you can use ! to reverse true and false
console.log(!true); // false
console.log(!false); // true
```

</details>
<details>
<summary>🐣 <code>&&</code> and</summary>

```js
'use strict';
console.log('-- and --');

console.log(true && true); // true
console.log(true && false); // false
console.log(false && true); // false
console.log(false && false); // false
```

</details>
<details>
<summary>🐣 <code>||</code> or</summary>

```js
'use strict';
console.log('-- or --');

console.log(true || true); // true
console.log(true || false); // true
console.log(false || true); // true
console.log(false || false); // false
```

</details>

<details>
<summary>🐣 arithmetic</summary>

```js
'use strict';
console.log('-- numbers: arithmetic --');

console.log(' +');
// adding numbers
console.log(1 + 1); // 2
console.log(-1 + 1); // 0

console.log(' -');
// subtracting numbers
console.log(3 - 2); // 1
console.log(2 - 3); // -1

console.log(' *');
// multiplying numbers
console.log(3 * 2); // 6
console.log(3 * 5); // 15

console.log(' /');
// dividing numbers
console.log(30 / 2); // 15
console.log(12 * 3); // 4

console.log(' %');
// finding the remainder
console.log(3 % 2); // 1
console.log(3 % 3); // 0
```

</details>

<details>
<summary>🐣  comparisons</summary>

```js
'use strict';
console.log('-- relational operators --');

console.log(' >');
// is the left number bigger than the right one?
console.log(3 > 22); // false
console.log(22 > 3); // true
console.log(1 > 1); // false

console.log(' <');
// is the left number smaller than the right one?
console.log(3 < 22); // true
console.log(22 < 3); // false
console.log(1 < 1); // false

console.log(' >=');
// is the left number bigger than OR equal to the right one?
console.log(3 >= 22); // false
console.log(22 >= 3); // true
console.log(1 >= 1); // true

console.log(' <=');
// is the left number smaller than OR equal to the right one?
console.log(3 <= 22); // true
console.log(22 <= 3); // false
console.log(1 <= 1); // true
```

</details>
