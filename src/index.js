const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { Worker } = require('worker_threads');

port = -1;
for (let i = 2; i < process.argv.length; ++i) {
  if (process.argv[i] === '-p')
    port = parseInt(process.argv[++i]);
}

if (port === -1) {
  console.log('Usage: node', path.basename(__filename), '[-p <port>]');
  return;
}

function verifyRequest(request) {
  if (request.method === 'POST') {
    const input = request.body;
    if (input.events && input.events[0].message.type === 'text')
      return Promise.resolve({
        replyToken: input.events[0].replyToken,
        text: input.events[0].message.text,
      });
    else
      return Promise.reject('Invalid body');
  } else {
    return Promise.reject('Invalid method');
  }
}

function reply(replyToken, messages) {
  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });
}

function handleRequest(request) {
  return verifyRequest(request)
    .then(input => {
      const pathname = request.path.substring(1);
      if (pathname.endsWith('chatsonic'))
        input.apiKey = process.env.CHATSONIC_API_KEY;
      else
        return 'Invalid path';
      const worker = new Worker(path.join(__dirname, `${pathname}.js`), {
        workerData: input,
      });
      worker.on('message', data => {
        reply(data.replyToken, data.messages);
      });
      return 'OK';
    })
    .catch(err => err || 'Invalid request');
}

const app = express();
app.use(express.json());

app.post('/:bot', (req, res) => {
  handleRequest(req)
    .then(json => res.json(json));
});

app.listen(port, () => {
  console.log('Listening on port', port);
});
