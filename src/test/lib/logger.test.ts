import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';

/**
 * The logger guarantees:
 *   - warn / error always emit
 *   - info / debug emit in dev (vitest sets DEV by default)
 *   - the scope is prefixed in brackets so log filters work
 */
describe('lib/logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes the scope in brackets', () => {
    logger.warn('PaymentService', 'Retrying release', { attempt: 2 });
    expect(warnSpy).toHaveBeenCalledWith('[PaymentService]', 'Retrying release', { attempt: 2 });
  });

  it('always emits warn and error', () => {
    logger.warn('S', 'w');
    logger.error('S', 'e');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('routes debug through console.log (dev mode)', () => {
    logger.debug('S', 'd');
    // info/debug fire in dev; vitest's import.meta.env.PROD is false
    expect(logSpy).toHaveBeenCalledWith('[S]', 'd');
  });

  it('routes info through console.info (dev mode)', () => {
    logger.info('S', 'i');
    expect(infoSpy).toHaveBeenCalledWith('[S]', 'i');
  });

  it('forwards rest arguments verbatim', () => {
    const err = new Error('boom');
    logger.error('Auth', 'Login failed', err, { userId: 'u1' });
    expect(errorSpy).toHaveBeenCalledWith('[Auth]', 'Login failed', err, { userId: 'u1' });
  });
});
