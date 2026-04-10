'use strict';

/**
 * convertEcowittToWindy
 *
 * Converts an EcoWitt (x-www-form-urlencoded) parsed payload into the
 * Windy Stations API v2 query-parameter format.
 *
 * Unit conversion reference:
 *   EcoWitt → Windy
 *   ──────────────────────────────────────────────────────────────────
 *   tempf   (°F)            → temp      (°C)
 *   humidity (%)            → humidity  (%)          – no conversion
 *   windspeedmph (mph)      → wind      (m/s)
 *   windgustmph  (mph)      → gust      (m/s)
 *   winddir (°)             → winddir   (°)          – no conversion
 *   baromrelin (inHg)       → mbar      (hPa)
 *   rainratein (in/hr)      → precip    (mm)  [rate, not used by Windy directly]
 *   hourlyrainin (in)       → precip    (mm)  [accumulated over last hour]
 *   dewptf  (°F) [derived]  → dewpoint  (°C)
 *   uv (index)              → uvi       (index)
 *   solarradiation (W/m²)   → radiation (W/m²)       – no conversion
 *   _receivedAt (ISO8601)   → ts        (UNIX seconds)
 */

const F_TO_C = (f) => parseFloat(((f - 32) * 5 / 9).toFixed(1));
const MPH_TO_MS = (mph) => parseFloat((mph * 0.44704).toFixed(2));
const INHG_TO_HPA = (inHg) => parseFloat((inHg * 33.8639).toFixed(1));
const IN_TO_MM = (inches) => parseFloat((inches * 25.4).toFixed(2));

function convertEcowittToWindy(ecowitt) {
  const windy = {};

  // ── Timestamp ─────────────────────────────────────────────────────────────
  // Prefer the station-supplied dateutc field, fall back to _receivedAt
  if (ecowitt.dateutc && ecowitt.dateutc !== 'now') {
    windy.ts = Math.floor(new Date(ecowitt.dateutc.replace(' ', 'T') + 'Z').getTime() / 1000);
  } else if (ecowitt._receivedAt) {
    windy.ts = Math.floor(new Date(ecowitt._receivedAt).getTime() / 1000);
  } else {
    windy.ts = Math.floor(Date.now() / 1000);
  }

  // ── Temperature ───────────────────────────────────────────────────────────
  if (ecowitt.tempf != null) windy.temp = F_TO_C(parseFloat(ecowitt.tempf));

  // ── Humidity ──────────────────────────────────────────────────────────────
  if (ecowitt.humidity != null) windy.humidity = parseFloat(ecowitt.humidity);

  // ── Wind ──────────────────────────────────────────────────────────────────
  if (ecowitt.windspeedmph != null) windy.wind = MPH_TO_MS(parseFloat(ecowitt.windspeedmph));
  if (ecowitt.windgustmph  != null) windy.gust = MPH_TO_MS(parseFloat(ecowitt.windgustmph));
  if (ecowitt.winddir      != null) windy.winddir = parseFloat(ecowitt.winddir);

  // ── Pressure ──────────────────────────────────────────────────────────────
  // Prefer relative (sea-level) barometric pressure
  if (ecowitt.baromrelin != null) {
    windy.mbar = INHG_TO_HPA(parseFloat(ecowitt.baromrelin));
  } else if (ecowitt.baromabsin != null) {
    windy.mbar = INHG_TO_HPA(parseFloat(ecowitt.baromabsin));
  }

  // ── Dew point ─────────────────────────────────────────────────────────────
  if (ecowitt.dewptf != null) {
    windy.dewpoint = F_TO_C(parseFloat(ecowitt.dewptf));
  }

  // ── Precipitation (hourly accumulation) ───────────────────────────────────
  if (ecowitt.hourlyrainin != null) {
    windy.precip = IN_TO_MM(parseFloat(ecowitt.hourlyrainin));
  }

  // ── Solar & UV ────────────────────────────────────────────────────────────
  if (ecowitt.solarradiation != null) windy.radiation = parseFloat(ecowitt.solarradiation);
  if (ecowitt.uv             != null) windy.uvi       = parseFloat(ecowitt.uv);

  return windy;
}

module.exports = { convertEcowittToWindy };
