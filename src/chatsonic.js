const fetch = require('node-fetch');
const { parentPort, workerData } = require('worker_threads');

const { replyToken, text, apiKey } = workerData;
fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium&language=en', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-KEY': apiKey,
  },
  body: JSON.stringify({
    'enable_google_results': false,
    'enable_memory': false,
    'input_text': text
  }),
}).then(resp => resp.json())
  .then(json => {
    const messages = json.image_urls.map(url => {
      return {
        type: 'image',
        originalContentUrl: url,
        previewImageUrl: url,
      };
    });
    if (json.message)
      messages.unshift({
        type: 'text',
        text: json.message,
      });
    parentPort.postMessage({
      replyToken,
      messages,
    });
  });
