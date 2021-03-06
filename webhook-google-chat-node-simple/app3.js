/* using axios.post(url, body, options) */
/* works when vpn off and proxy off */
const axios = require('axios');

async function invokeWebhookForGoogleChat() {
  const url =
    'https://chat.googleapis.com/v1/spaces/AAAAjlROM8c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=-fFXFvlid5DR0Jb90uz42nyywWkjzUNRKYlzegUP6Bo%3D';
  const body = {
    text: 'Incoming webhook with NodeJS - hello from a NodeJS script!',
  };
  const options = {
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  };
  try {
    const response = await axios.post(url, body, options);
    // console.log(response);
    // console.log(response.data);
    return response.data;
  } catch (err) {
    console.log(err);
    return err;
  }
}

invokeWebhookForGoogleChat();
7