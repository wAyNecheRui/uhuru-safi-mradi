/**
 * Lightweight structured logger.
 *
 * Goals:
 *  - In production: silence `debug` and `info`, keep `warn` and `error`
 *    so we don't flood end-users' consoles or leak diagnostic noise.
 *  - In development: keep everything for easier debugging.
 *  - Provide a single seam we can later wire up to a remote sink
 *    (e.g. Sentry, Logflare) without touching every call site.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('PushService', 'Registered token', { token });
 *   logger.error('PushService', 'Init failed', err);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = import.meta.env.PROD;

// In production, only warn/error make it to the console.
const enabled: Record<LogLevel, boolean> = {
  debug: !isProd,
  info: !isProd,
  warn: true,
  error: true,
};

function emit(level: LogLevel, scope: string, message: string, ...rest: unknown[]) {
  if (!enabled[level]) return;
  const tag = `[${scope}]`;
  // eslint-disable-next-line no-console
  const fn = level === 'debug' ? console.log : console[level];
  fn(tag, message, ...rest);
}

export const logger = {
  debug: (scope: string, message: string, ...rest: unknown[]) => emit('debug', scope, message, ...rest),
  info: (scope: string, message: string, ...rest: unknown[]) => emit('info', scope, message, ...rest),
  warn: (scope: string, message: string, ...rest: unknown[]) => emit('warn', scope, message, ...rest),
  error: (scope: string, message: string, ...rest: unknown[]) => emit('error', scope, message, ...rest),
};

export type Logger = typeof logger;
