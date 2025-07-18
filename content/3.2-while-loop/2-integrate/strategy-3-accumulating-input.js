// Accumulating Input: Concatenate user input until length >= 10

'use strict';

let text = '';
while (text.length < 10) {
  let more = prompt('Current: "' + text + '". Add more:');
  if (more !== null) {
    text = text + more;
  }
}
alert('Final string: ' + text);
