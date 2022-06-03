//const fetch = require('node-fetch');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const webhookURL =
  'https://chat.googleapis.com/v1/spaces/AAAAjlROM8c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=-fFXFvlid5DR0Jb90uz42nyywWkjzUNRKYlzegUP6Bo%3D';

const data = JSON.stringify({
  text: 'Incoming webhook with Node - hello from a Node script!',
});

fetch(webhookURL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
  body: data,
})
  .then((response) => {
    console.log(response);
  })
  .catch((err) => {
    console.log(err);
  });
