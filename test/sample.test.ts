import { describe, expect, it } from '@jest/globals';

// The codebase uses CommonJS `require` (see src/services/email/index.ts), so
// follow the same convention here to avoid ESM/CJS type-resolution issues.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendWelcomeEmail } = require('../src/services/email');

describe('email service', () => {
  it('exposes sendWelcomeEmail', () => {
    expect(typeof sendWelcomeEmail).toBe('function');
  });
});

describe('sample', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
