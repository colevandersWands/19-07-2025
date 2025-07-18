'use strict';

let before = 'camel';

let after = '';

let upperCase = false;
for (let char of before) {
  if (upperCase) {
    after = after + char.toUpperCase();
  } else {
    after = after + char.toLowerCase();
  }
  upperCase = !upperCase;
}

console.log(after === 'cAmEl');
