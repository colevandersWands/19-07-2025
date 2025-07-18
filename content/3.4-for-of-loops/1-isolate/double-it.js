'use strict';

let string = '_-|-_';

let doubled = '';
for (let character of string) {
  doubled = doubled + character + character;
}

console.log(doubled === '__--||--__');
