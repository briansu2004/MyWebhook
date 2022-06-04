/* using axiosInstance */
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  simple: false,
  resolveWithFullResponse: true,
});

let agent = httpsAgent;
const axiosInstance = require('axios').create({
  adapter: require('axios/lib/adapters/http'),
  timeout: 90000,
  proxy: false,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
  httpsAgent: agent,
});

const url =
  'https://chat.googleapis.com/v1/spaces/AAAAjlROM8c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=-fFXFvlid5DR0Jb90uz42nyywWkjzUNRKYlzegUP6Bo%3D';
const reqBody = JSON.stringify({
  text: 'Incoming webhook with Node - hello from a Node script!',
});

axiosInstance
  .post(url, reqBody, {})
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });
