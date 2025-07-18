'use strict';

let input = prompt('something longer than 4 characters:');

if (input !== null) {
  if (input.length <= 4) {
    alert('too short!');
  } else {
    alert('perfect');
  }
} else {
  alert(':(');
}
