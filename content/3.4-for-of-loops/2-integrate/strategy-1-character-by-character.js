// Character-by-Character: Iterate through a string one character at a time

'use strict';

let input = null;
while (input === null) {
  input = prompt('enter a string:');
}

let result = '';
for (let char of input) {
  result = result + char + '-';
}
alert(result.slice(0, -1));
