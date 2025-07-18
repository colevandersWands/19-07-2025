# Users

Users will use your running programs, but will never see your source code. When
writing for a user you need to think of their needs and their experience using
your program.

For now the user experience of your programs will be limited to pop-up boxes,
but that doesn't mean you can't think of UX (User Experience). A user always
appreciates  clear instructions, helpful feedback and a friendly tone in your
messages.

How does thinking of a user help you write code that they will never see? It's
about keeping the big picture in mind and making priorities. It's easy to get
caught up in the details of your code, taking a step back to remember who you're
developing for and why they need this program keeps your priorities in
perspective.

---

## Programs: Users

Users and on the left in this diagram, developers are on the right.

- **For Users**
  - **Inputting Data**: `prompt` is a simple way for users to input data to a
    JavaScript program.
  - **Outputting Data**: `alert` is a simple way for the computer to display
    data to a user.

[![program diagram](../assets/a-program.png)](https://excalidraw.com/#json=40qMI89WByj9Yhhh94Ghg,4zpL-AmDgpnbyFJWJfNQhg)

---

## Basic User Interactions in JavaScript

different programming environments have different user interactions. in the browser the main one is the DOM (Document Object Model) this is how everything you see on your screen is created! but you won't be studying that for now

the browser has some simpler ways to interact with the user. you will be focusing on these for a while:

- `alert`: displays a message to the user
- `prompt`: asks the users to input some text
- `confirm`: asks a user to say "yes" or "no"

All of these instruct the computer to show something to the user. the program will pause until the user responds then the program continues executing, using the user's input

```js
// alert just displays text, you cannot type anything
alert('(alert) hello! the program is paused until you click "ok"');

// prompt allows the user to pass a string or `null` into the program
//  (you'll learn more about strings and `null` very soon)
let input = prompt('(prompt) you can type then click "ok" or "cancel"');

alert(input);
```
