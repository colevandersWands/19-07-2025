'use strict';

let input = prompt('something longer than 4 characters:');

if (input === null) {
  alert(':(');
} else {
  if (input.length > 4) {
    alert('perfect');
  } else {
    alert('too short!');
  }
}
