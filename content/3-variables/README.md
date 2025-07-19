# Variables

Variables are a good place to start understanding communication between developers and the
computer. They are one tool a developer has to make a program easier to read, and they are
one way can you instruct computers to read & write program memory.

You can think of variables [like boxes](https://www.youtube.com/watch?v=Jvrszgiexg0) used
to store data in your programs. (_That video uses `var` but these programs use `let`. For
now you can think of them as the same thing._)

Study the JavaScript files in this folder to see the 4 main things you can do with a
variable:

- **Declaring**
- **Declaring and Initializing**
- **Assigning**
- **Reading**

## Variables Syntax

[![variable: declare, initialize](./variable-declare-initialize.jpg)](https://blog.jordanholt.dev/learn-javascript-variables/)

```js
/*
  let           -> declaration
  iAm           -> variable name
  =             -> assignment operator (initialization)
  'a variable'  -> the initial value
*/
let iAm = 'a variable';
console.log(iAm);

/*
  iAm           -> variable name
  =             -> assignment operator
  'a variable'  -> the new value
*/
iAm = 'hungry';
console.log(iAm);
```

<details>
<summary>🥚 declare, initialize, assign</summary>

```js
// declare the variable using let
// initialize the value: "Hello!"
let message = 'Hello!';

// assign a new value: "World!"
message = 'World!';

// read the stored value: "World!"
console.log(message);
```

```js
'use strict';

// declare the variable using let
// initialize the value: '.'
let dot = '.';

// read the stored value: '.'
// read the stored value: '.'
// assign a new value: '..'
dot = dot + dot;

// read the stored value: '..'
console.log(dot); // '..'
```

```js
'use strict';
console.log('-- declare, initialize, assign --');

// declare a value and initialize it's value
let favoriteTree = 'palm';
console.log(favoriteTree); // 'palm'

// assigning a different value
favoriteTree = 'oak';
console.log(favoriteTree); // 'oak'

// declare variable with an initial value
let bread = 'fresh';
console.log(bread); // 'fresh'

// re-assign the variable
bread = 'stale';
console.log(bread); // 'stale'
```

</details>
<details>
<summary>🥚 uninitialized variables</summary>

```js
'use strict';
console.log('-- uninitialized variables --');

// declaring a variable without an initial value
//  it will be initialized to undefined by default
let uninitialized;
console.log(uninitialized); // undefined

// you can assign values to uninitialized variables
uninitialized = 'something';
console.log(uninitialized); // 'something'

// initializing a variable to undefined does the same thing
let initialized = undefined;
console.log(initialized); // undefined
```

</details>

> PS. In this module you will only learn about `let`. You will cover `const` and `var` in
> later modules.

---

## References

- [launchcode](https://education.launchcode.org/intro-to-professional-web-dev/chapters/data-and-variables/variables.html)
- [javascript.info](https://javascript.info/variables)
- [programiz](https://www.programiz.com/javascript/variables-constants)
- [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [HYF](https://hackyourfuture.github.io/study/#/javascript/variables)
