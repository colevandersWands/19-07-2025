// Conditional Counting: Count how many times user enters "yes"

'use strict';

let count = 0;
let input = '';
while (input !== null) {
  input = prompt('Type "yes" to count, or cancel to finish:');
  if (input === 'yes') {
    count = count + 1;
  }
}
alert('You typed yes ' + count + ' times.');
