function verifyRequest(request) {
  if (request.method === 'POST') {
    return request.json()
      .then(input => {
        if (input.events && input.events[0].message.type === 'text')
          return {
            replyToken: input.events[0].replyToken,
            text: input.events[0].message.text,
          };
        else
          return Promise.reject();
      });
  } else {
    return Promise.reject();
  }
}

function chatsonic(text, env) {
  return fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium&language=en', {
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
      return messages;
    });
}

function reply(replyToken, messages, env) {
  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });
}

function handleRequest(request, env) {
  return verifyRequest(request)
    .then(input => {
      const { pathname } = new URL(request.url);
      let promise;
      if (pathname.endsWith('/chatsonic'))
        promise = chatsonic(input.text, env);
      if (promise) {
        return promise
          .then(messages => reply(input.replyToken, messages, env));
      } else {
        return Promise.reject();
      }
    }).catch(() => {
      return 'Invalid request';
    });
}

export default {
  async fetch(request, env) {
    return new Response(JSON.stringify(await handleRequest(request, env)));
  }
};
