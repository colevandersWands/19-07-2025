// Sentinel Value: Keep prompting until user enters 'stop'

'use strict';

let input = '';
while (input !== 'stop') {
  input = prompt('Enter something (type "stop" to finish):');
}
alert('You typed stop!');
