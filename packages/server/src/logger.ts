import { get, useDefaults } from 'js-logger';
import type { ILogLevel } from 'js-logger';

// js-logger level constants (stable since v1.0, matches src/logger.js)
const LEVELS: Record<string, ILogLevel> = {
  TRACE: { value: 1, name: 'TRACE' },
  DEBUG: { value: 2, name: 'DEBUG' },
  INFO: { value: 3, name: 'INFO' },
  WARN: { value: 5, name: 'WARN' },
  ERROR: { value: 8, name: 'ERROR' },
};

const envLevel = process.env.LOG_LEVEL?.toUpperCase() ?? '';
const productionDefault: ILogLevel = { value: 3, name: 'INFO' };
const developmentDefault: ILogLevel = { value: 2, name: 'DEBUG' };
const defaultLevel: ILogLevel =
  LEVELS[envLevel] ??
  (process.env.NODE_ENV === 'production'
    ? productionDefault
    : developmentDefault);

useDefaults({
  defaultLevel,
  formatter(messages, context) {
    messages.unshift(new Date().toISOString(), `[${context.name ?? 'server'}]`);
  },
});

export const log = get('server');
export const authLog = get('auth');
export const wsLog = get('ws');
