'use strict';

let languageName = 'JavaScript';

let reversedName = '';
for (let character of languageName) {
  reversedName = character + reversedName;
}

console.log(reversedName === 'tpircSavaJ');
