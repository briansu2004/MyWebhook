/* using axios({method: 'post', url: url, data: data, options,}) */
const axios = require('axios');

async function invokeWebhookForGoogleChat() {
  const url =
    'https://chat.googleapis.com/v1/spaces/AAAAjlROM8c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=-fFXFvlid5DR0Jb90uz42nyywWkjzUNRKYlzegUP6Bo%3D';
  const options = {
    'Content-Type': 'application/json',
  };

  const bot_message = {
    text: 'Incoming webhook with Python - hello from a Python script!',
  };

  let res;
  await axios({
    method: 'post',
    url: url,
    data: bot_message,
    options,
  })
    .then((result) => {
      res = result;
    })
    .catch((error) => {
      res = error;
    });

  console.log(res);
  //console.log(res.data);
  return res;
}

invokeWebhookForGoogleChat();
