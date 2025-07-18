'use strict';

let input = null;
while (input === null) {
  input = prompt('enter something');
}

if (input === '') {
  alert(':(');
} else {
  alert('your input: ' + input);
}
