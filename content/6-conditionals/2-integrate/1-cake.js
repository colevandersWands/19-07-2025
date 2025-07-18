'use strict';

let likesCake = confirm('do you like cake?');

let message = '';
if (likesCake === true) {
  message = 'me too!';
} else {
  message = 'me neither!';
}

alert(message);
