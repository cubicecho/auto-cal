import pkg from 'js-logger';
import type { GlobalLogger, ILogLevel } from 'js-logger';

// js-logger is CJS; named imports don't work in ESM at runtime. Import the
// default (module.exports) and cast so TypeScript sees the full GlobalLogger API.
const Logger = pkg as unknown as GlobalLogger;

// Stable level values from js-logger src/logger.js — avoids accessing Logger
// constants before useDefaults is called.
const LEVELS: Record<string, ILogLevel> = {
  TRACE: { value: 1, name: 'TRACE' },
  DEBUG: { value: 2, name: 'DEBUG' },
  INFO: { value: 3, name: 'INFO' },
  WARN: { value: 5, name: 'WARN' },
  ERROR: { value: 8, name: 'ERROR' },
};

const productionDefault: ILogLevel = { value: 3, name: 'INFO' };
const developmentDefault: ILogLevel = { value: 2, name: 'DEBUG' };
const envLevel = process.env.LOG_LEVEL?.toUpperCase() ?? '';
const defaultLevel: ILogLevel =
  LEVELS[envLevel] ??
  (process.env.NODE_ENV === 'production'
    ? productionDefault
    : developmentDefault);

Logger.useDefaults({
  defaultLevel,
  formatter(messages, context) {
    messages.unshift(new Date().toISOString(), `[${context.name ?? 'server'}]`);
  },
});

export const log = Logger.get('server');
export const authLog = Logger.get('auth');
export const wsLog = Logger.get('ws');
