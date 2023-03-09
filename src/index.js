addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

function ask(text) {
  return fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium&language=en', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-KEY': WRITESONIC_API_KEY,
    },
    body: JSON.stringify({
      'enable_google_results': false,
      'enable_memory': false,
      'input_text': text
    }),
  });
}

function reply(replyToken, text) {
  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{
        type: 'text',
        text,
      }]
    }),
  });
}

function chat(request) {
  return new Promise((resolve) => {
    request.json()
      .then(input => {
        if (input.events && input.events[0].message.type === 'text') {
          const replyToken = input.events[0].replyToken;
          const text = input.events[0].message.text;
          ask(text)
            .then(resp => resp.json())
            .then(json => reply(replyToken, json.message))
            .then(resp => resp.json())
            .then(json => {
              resolve('OK');
            });
        } else {
          resolve('Invalid input');
        }
      });
  });
}

async function handleRequest(request) {
  let resp;

  const { pathname } = new URL(request.url);
  if (request.method === 'POST' && pathname === '/')
    resp = chat(request);
  else
    resp = Promise.resolve('Invalid request');

  resp = new Response(await resp);
  return resp;
}
