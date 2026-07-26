// netlify/functions/send-notification.js
//
// Server-side function: receives { title, body, tokens } from the admin
// panel, authenticates to Firebase using the service account credentials
// (stored as Netlify environment variables, never exposed to the browser),
// and sends a push notification to every token via the FCM HTTP v1 API.

const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = 'akmaldream11pak';

let cachedAuth = null;
function getAuth() {
  if (cachedAuth) return cachedAuth;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY environment variable');
  }

  // Netlify stores the value as literal \n sequences sometimes; normalize.
  privateKey = privateKey.replace(/\\n/g, '\n');

  cachedAuth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  return cachedAuth;
}

async function getAccessToken() {
  const auth = getAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token || tokenResponse;
}

async function sendToToken(accessToken, token, title, body) {
  const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
  const message = {
    message: {
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192-1.png',
        },
        fcm_options: {},
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, token, error: errText };
  }
  return { ok: true, token };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { title, body, tokens } = payload;

  if (!title || !body || !Array.isArray(tokens) || tokens.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing title, body, or tokens[]' }),
    };
  }

  try {
    const accessToken = await getAccessToken();

    const results = await Promise.all(
      tokens.map((t) => sendToToken(accessToken, t, title, body))
    );

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.length - successCount;
    const failedTokens = results.filter((r) => !r.ok).map((r) => ({ token: r.token, error: r.error }));

    return {
      statusCode: 200,
      body: JSON.stringify({ successCount, failCount, failedTokens }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || String(err) }),
    };
  }
};
