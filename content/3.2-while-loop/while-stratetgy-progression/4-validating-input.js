// Validating Input: Only accept a non-empty string

'use strict';

let input = '';
while (input === '') {
  input = prompt('Enter a non-empty string:');
  if (input === null) {
    input = '';
  }
}
alert('Thank you: ' + input);
