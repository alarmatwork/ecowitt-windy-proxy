'use strict';

const fs = require('fs');
const axios = require('axios');
const { DATA_FILE } = require('../routes/ecowitt');
const { convertEcowittToWindy } = require('../converters/ecowitt2windy');
const logger = require('../utils/logger');

const WINDY_API_BASE = 'https://stations.windy.com/api/v2/observation/update';
const WINDY_PASSWORD = process.env.WINDY_STATION_PASSWORD;
const WINDY_STATION_ID = process.env.WINDY_STATION_ID;

/**
 * uploadToWindy
 *
 * Scheduled job (called every 60 s):
 *   1. Read the latest EcoWitt payload from disk.
 *   2. Convert to Windy measurement format.
 *   3. POST/GET to the Windy Stations v2 API.
 */
async function uploadToWindy() {
  // ── 1. Guard: make sure credentials are configured ────────────────────────
  if (!WINDY_PASSWORD || !WINDY_STATION_ID) {
    logger.warn('[windy] WINDY_STATION_PASSWORD or WINDY_STATION_ID is not set – skipping upload');
    return;
  }

  // ── 2. Read file ──────────────────────────────────────────────────────────
  if (!fs.existsSync(DATA_FILE)) {
    logger.info('[windy] No data file yet – nothing to upload');
    return;
  }

  let ecowittData;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    ecowittData = JSON.parse(raw);
  } catch (err) {
    logger.error('[windy] Failed to read/parse data file:', err.message);
    return;
  }

  // ── 3. Convert ────────────────────────────────────────────────────────────
  const windyParams = convertEcowittToWindy(ecowittData);
  logger.info('[windy] Converted payload:', JSON.stringify(windyParams));

  // ── 4. Send to Windy ──────────────────────────────────────────────────────
  // The new v2 API accepts the observation as query parameters on GET
  // (or POST body). We use GET with query params as documented.
  try {
    const response = await axios.get(WINDY_API_BASE, {
      params: {
        PASSWORD: WINDY_PASSWORD,
        stationId: WINDY_STATION_ID,
        ...windyParams,
      },
      timeout: 10_000,
    });

    logger.info(`[windy] Upload OK – status ${response.status}:`, JSON.stringify(response.data ?? ''));
  } catch (err) {
    if (err.response) {
      logger.error(
        `[windy] Upload failed – HTTP ${err.response.status}:`,
        JSON.stringify(err.response.data ?? ''),
      );
    } else {
      logger.error('[windy] Upload failed – network error:', err.message);
    }
  }
}

module.exports = { uploadToWindy };
