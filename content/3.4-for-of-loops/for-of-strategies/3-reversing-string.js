// Reversing String: Build a reversed copy of the input

'use strict';

let input = null;
while (input === null) {
  input = prompt('enter a string:');
}

let reversed = '';
for (let char of input) {
  reversed = char + reversed;
}
alert(reversed);
