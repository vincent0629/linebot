async function verifyRequest(request) {
  if (request.method === 'POST') {
    const input = await request.json();
    if (input.events && input.events[0].message.type === 'text')
      return {
        replyToken: input.events[0].replyToken,
        text: input.events[0].message.text,
      };
  }
}

function chatsonic(text, env) {
  return new Promise((resolve) => {
    fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium&language=en', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': env.CHATSONIC_API_KEY,
      },
      body: JSON.stringify({
        'enable_google_results': false,
        'enable_memory': false,
        'input_text': text
      }),
    }).then(resp => resp.json())
      .then(json => {
        resolve(json.message);
      });
  });
}

function reply(replyToken, text, env) {
  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LINE_ACCESS_TOKEN}`,
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

async function handleRequest(request, env) {
  let resp;

  const { pathname } = new URL(request.url);
  const input = await verifyRequest(request);
  if (input) {
    let promise;
    if (pathname === '/chatsonic')
      promise = chatsonic(input.text, env);
    if (promise) {
      await promise
        .then(text => reply(input.replyToken, text, env));
      resp = new Response('OK');
    }
  }

  if (!resp)
    resp = new Response('Invalid request');
  return resp;
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  }
};
