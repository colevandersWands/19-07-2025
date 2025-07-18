// Finding First: Find the first occurrence of a character

'use strict';

let input = null;
while (input === null) {
  input = prompt('enter a string:');
}

let target = null;
while (target === null) {
  target = prompt('enter a character to find:');
}

let found = false;
let position = 0;

for (let char of input) {
  if (char === target && !found) {
    found = true;
  }
  position = position + 1;
}

if (!found) {
   alert('found ' + target + ' at position ' + position);
} else {
  alert('did not find ' + target);
}
