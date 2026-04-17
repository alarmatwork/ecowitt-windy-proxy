'use strict';
require('dotenv').config(); // loads .env when running locally; no-op in Docker

const express = require('express');
const multer = require('multer');
const cron = require('node-cron');
const { receiveEcowittData, getLatest } = require('./routes/ecowitt');
const { sendPushoverNotification } = require('./routes/pushover');
const { uploadToWindy } = require('./jobs/windyUploader');
const logger = require('./utils/logger');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 8888;

// ── Middleware ────────────────────────────────────────────────────────────────
// EcoWitt sends data as application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/receiveEcowittData', receiveEcowittData);
app.post('/sendPushoverNotification', upload.any(), sendPushoverNotification);
app.get('/latest', getLatest);

// Health-check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Scheduled job – every 5 minutes ──────────────────────────────────────────
cron.schedule('0 */5 * * * *', async () => {
  logger.info('[cron] Triggering Windy upload job...');
  try {
    await uploadToWindy();
  } catch (err) {
    logger.error('[cron] Windy upload failed:', err.message);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);
  const addr = ips.length ? ips.join(', ') : '127.0.0.1';
  logger.info(`✅ EcoWitt→Windy proxy running on ${addr}:${PORT}`);
  logger.info('   POST /receiveEcowittData  – receives EcoWitt payloads');
  logger.info('   GET  /health              – health check');
  logger.info('   GET  /sendPushoverNotification – sends Pushover notification');
  logger.info('   Windy upload job fires every 5 minutes');
});
