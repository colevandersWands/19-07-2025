'use strict';

let a = 'y';
let b = 'x';
let temp;

temp = a;
a = b;
b = temp;

console.log(a, b, temp);

/*
  - is it possible to swap the variables without using `temp`?
  - mark each variable use with a different color (like in the ?variables lens)
  - use lines to connect each variable declaration to it's uses

  done with these questions?  try "ask me" and "random line"
*/
