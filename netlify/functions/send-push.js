const webpush = require('web-push');

const FIREBASE_DB_URL = 'https://marie-faa8f-default-rtdb.europe-west1.firebasedatabase.app';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text } = JSON.parse(event.body || '{}');
    const message = text || 'Du hast einen neuen Stern bekommen.';

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'VAPID keys not configured' }) };
    }

    webpush.setVapidDetails('mailto:example@example.com', vapidPublicKey, vapidPrivateKey);

    // Marie's gespeicherte Push-Subscription aus Firebase holen
    const res = await fetch(FIREBASE_DB_URL + '/pushSubscription.json');
    const subscription = await res.json();

    if (!subscription || !subscription.endpoint) {
      return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'no subscription stored' }) };
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: 'Fleißheft', body: message })
    );

    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
