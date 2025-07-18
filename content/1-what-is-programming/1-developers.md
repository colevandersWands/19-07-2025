# Developers

Developers are the ones designing the software, writing the code, and fixing the bugs. As
a developer you'll spend lots of time reading source code. So it's very important to make
sure your code is easy to understand.

You should think first of other developers who will need to understand your program, and
second of yourself. Why is this more productive? First because working on a team is easier
when everyone is looking out for each other. Second because one day you'll be someone
else! After even half an hour your thoughts about a program are no longer fresh, you'll
need to rely on what you wrote to figure out the details of your own program.

---

## Programs: Developers

Users and on the left in this diagram, developers are on the right.

- **For Developers**
  - **Static**: Comments, variable names and code formatting help developers read and
    understand source code.
  - **Dynamic**: Logs and error messages help developers understand what is happening
    inside the computer as it follows the code's instructions.

[![program diagram](./a-program.png)](https://excalidraw.com/#json=40qMI89WByj9Yhhh94Ghg,4zpL-AmDgpnbyFJWJfNQhg)

## Comments and Logs

Comments and logs are for developers, not for the computer. They exist to help you
understand your program.

Comments and logging will not change what your program does, just how easy it is to
understand.

### 🥚 Comments

```js
'use strict';
// comments are for people to read, not computers
// these are both one-line comments

// if you run or trace this snippet, nothing will happen
```

```js
'use strict';
/* this is a block comment

  block comments are useful for writing longer messages

  - and for
  - things like
  - lists

  if you run or trace this snippet nothing will happen
*/
```

---

### 🥚 Logging.

```js
'use strict';
// print a message to the browser's console
console.log('-- logging --');

// an empty log
console.log();

// you can log more than one thing at a time
console.log('a', 'message', 'from', 'beyond'); // 'a', 'message', 'from', 'beyond'
```

---

## References

- Comments
  - [launchcode](https://education.launchcode.org/intro-to-professional-web-dev/chapters/how-to-write-code/comments.html)
  - [programiz](https://www.programiz.com/javascript/comments)
  - [javascript.info](https://javascript.info/structure#code-comments)
  - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#comments)
- Logging
  - [launchcode](https://education.launchcode.org/intro-to-professional-web-dev/chapters/how-to-write-code/output.html?highlight=log)
  - [programiz](https://www.programiz.com/javascript/console)
  - [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Console/log)
