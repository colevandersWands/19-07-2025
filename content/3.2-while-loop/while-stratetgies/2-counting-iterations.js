// Counting Iterations: Prompt user 3 times

'use strict';

let count = 0;
while (count < 3) {
  let entry = prompt('Entry #' + (count + 1));
  alert('You entered: ' + entry);
  count = count + 1;
}
