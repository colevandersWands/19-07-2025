'use strict';

let input = null;
while (input === null) {
  input = prompt('enter a string:');
}

let target = null;
while (target === null) {
  target = prompt('enter a character to remove:');
}

let result = '';
for (let char of input) {
  if (char !== target) {
    result = result + char;
  }
}
alert(result);
