'use strict';

/**
 * Minimal structured logger.
 * In a production deployment you'd swap this for Winston/Pino,
 * but keeping it dependency-free keeps the image lean.
 */

const LEVELS = { info: 'INFO', warn: 'WARN', error: 'ERROR' };

function log(level, ...args) {
  const prefix = `[${new Date().toISOString()}] [${LEVELS[level]}]`;
  if (level === 'error') {
    console.error(prefix, ...args);
  } else if (level === 'warn') {
    console.warn(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

module.exports = {
  info:  (...args) => log('info',  ...args),
  warn:  (...args) => log('warn',  ...args),
  error: (...args) => log('error', ...args),
};
