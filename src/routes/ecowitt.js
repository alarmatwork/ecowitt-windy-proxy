'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const DATA_FILE = path.join(DATA_DIR, 'ecowitt_latest.json');

/**
 * POST /receiveEcowittData
 *
 * EcoWitt sends data as application/x-www-form-urlencoded.
 * We store the raw parsed body verbatim as JSON so nothing is lost.
 */
function receiveEcowittData(req, res) {
  const payload = req.body;
  logger.info(`[ecowitt] Received payload: ${JSON.stringify(payload)}`);
  if (!payload || Object.keys(payload).length === 0) {
    logger.warn('[ecowitt] Received empty payload – ignoring');
    return res.status(400).json({ error: 'Empty payload' });
  }

  // Attach a server-side received timestamp if EcoWitt hasn't already provided one
  const record = {
    ...payload,
    _receivedAt: new Date().toISOString(),
  };

  try {
    // Ensure the data directory exists
    fs.mkdirSync(DATA_DIR, { recursive: true });

    // Write / overwrite with latest data
    fs.writeFileSync(DATA_FILE, JSON.stringify(record, null, 2), 'utf8');

    logger.info(`[ecowitt] Stored payload (PASSKEY=${payload.PASSKEY ?? 'unknown'})`);
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('[ecowitt] Failed to write data file:', err.message);
    return res.status(500).json({ error: 'Storage failure' });
  }
}

/**
 * GET /latest
 *
 * Returns the most recently stored EcoWitt payload.
 */
function getLatest(_req, res) {
  if (!fs.existsSync(DATA_FILE)) {
    return res.status(404).json({ error: 'No data received yet' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return res.status(200).json(data);
  } catch (err) {
    logger.error('[ecowitt] Failed to read data file:', err.message);
    return res.status(500).json({ error: 'Failed to read data' });
  }
}

module.exports = { receiveEcowittData, getLatest, DATA_FILE };
