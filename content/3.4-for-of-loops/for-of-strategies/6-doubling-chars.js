// Doubling Characters: Double each character in the string

'use strict';

let input = null;
while (input === null) {
  input = prompt('enter a string:');
}

let doubled = '';
for (let char of input) {
  doubled = doubled + char + char;
}
alert(doubled);
