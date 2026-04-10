'use strict';
require('dotenv').config(); // loads .env when running locally; no-op in Docker

const express = require('express');
const cron = require('node-cron');
const { receiveEcowittData } = require('./routes/ecowitt');
const { uploadToWindy } = require('./jobs/windyUploader');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8888;

// ── Middleware ────────────────────────────────────────────────────────────────
// EcoWitt sends data as application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/receiveEcowittData', receiveEcowittData);

// Health-check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Scheduled job – every 60 seconds ─────────────────────────────────────────
cron.schedule('*/60 * * * * *', async () => {
  logger.info('[cron] Triggering Windy upload job...');
  try {
    await uploadToWindy();
  } catch (err) {
    logger.error('[cron] Windy upload failed:', err.message);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`✅ EcoWitt→Windy proxy running on port ${PORT}`);
  logger.info('   POST /receiveEcowittData  – receives EcoWitt payloads');
  logger.info('   GET  /health              – health check');
  logger.info('   Windy upload job fires every 60 seconds');
});
