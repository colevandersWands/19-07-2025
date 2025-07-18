'use strict';

let before = 'abcdefghijklmnopqrstuvwxyz';

let vowels = 'aeiou';

let after = '';
for (let letter of before) {
  if (!vowels.includes(letter)) {
    after = after + letter;
  }
}

console.log(after === 'bcdfghjklmnpqrstvwxyz');
