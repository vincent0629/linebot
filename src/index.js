function verifyRequest(request) {
  if (request.method === 'POST') {
    const input = request.body;
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
        resolve(messages);
      });
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
  const pathname = request.path;
  const input = verifyRequest(request);
  if (input) {
    let promise;
    if (pathname.endsWith('/chatsonic'))
      promise = chatsonic(input.text, env);
    if (promise) {
      return promise
        .then(messages => reply(input.replyToken, messages, env))
        .then(resp => resp.json());
    }
  }

  return Promise.reject('Invalid request');
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.handle = (req, res) => {
  handleRequest(req, process.env)
    .then(resp => {
      res.status(200).json(resp);
    }).catch(err => {
      res.status(400).json(err);
    });
};
