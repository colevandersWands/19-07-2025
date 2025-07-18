// Counting Characters: Count occurrences of a specific character

'use strict';

let input = null;
while (input === null) {
  input = prompt('enter a string:');
}

let target = null;
while (target === null) {
  target = prompt('enter a character to count:');
}

let count = 0;
for (let char of input) {
  if (char === target) {
    count = count + 1;
  }
}
alert('found ' + count + ' ' + target + '(s)');
