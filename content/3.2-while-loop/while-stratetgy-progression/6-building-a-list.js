// Building a List: Collect all non-empty inputs, stop on empty

'use strict';

let list = '';
let input = '';
while (input !== '' && input !== null) {
  input = prompt('Enter something (empty to finish):');
  if (input !== '' && input !== null) {
    list = list + input + ', ';
  }
}
alert('Collected: ' + list);
