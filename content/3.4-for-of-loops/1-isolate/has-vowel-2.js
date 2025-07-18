'use strict';

let word = 'zijn';

let hasVowel = false;

let vowels = 'aeiou';
for (let letter of word) {
  if (vowels.includes(letter)) {
    hasVowel = true;
  }
}

console.log(hasVowel === true);
