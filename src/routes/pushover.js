'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const PUSHOVER_API = 'https://api.pushover.net/1/messages.json';
const AUTH_TOKEN = 'h923h49283h42';

/**
 * GET /sendPushoverNotification
 *
 * Query params:
 *   message  – notification text, e.g. "AI@NAME_LOCATION"
 *   filename – the filename to include in the notification
 *   token    – shared secret to authorise the request
 */
async function sendPushoverNotification(req, res) {
  const { message, filename, token } = { ...req.query, ...req.body };

  if (token !== AUTH_TOKEN) {
    logger.warn('[pushover] Rejected request – invalid token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Missing required parameter: message' });
  }

  const pushoverUserKey = process.env.PUSHOVER_KEY;
  const pushoverAppToken = process.env.PUSHOVER_APP_TOKEN;
  if (!pushoverUserKey || !pushoverAppToken) {
    logger.error('[pushover] PUSHOVER_KEY or PUSHOVER_APP_TOKEN is not set in environment');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const body = message + (filename ? ` [${filename}]` : '');

  try {
    await axios.post(PUSHOVER_API, {
      token: pushoverAppToken,
      user: pushoverUserKey,
      message: body,
    });

    logger.info(`[pushover] Notification sent: ${body}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    const detail = err.response?.data ?? err.message;
    logger.error('[pushover] Failed to send notification:', detail);
    return res.status(502).json({ error: 'Pushover delivery failed', detail });
  }
}

module.exports = { sendPushoverNotification };
