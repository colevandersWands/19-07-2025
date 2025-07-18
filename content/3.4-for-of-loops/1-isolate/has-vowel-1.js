'use strict';

let text = 'xkcd';

let hasVowel = false;

let vowels = 'aeiou';
for (let char of text) {
  if (vowels.includes(char)) {
    hasVowel = true;
  }
}

console.log(hasVowel === false);
