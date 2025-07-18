'use strict';

let flag = false;

while (!flag) {
  flag = confirm('you can only leave this loop if you confirm');
}

alert('you confirmed');
