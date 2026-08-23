"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// The codebase uses CommonJS `require` (see src/services/email/index.ts), so
// follow the same convention here to avoid ESM/CJS type-resolution issues.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendWelcomeEmail } = require('../src/services/email');
(0, globals_1.describe)('email service', () => {
    (0, globals_1.it)('exposes sendWelcomeEmail', () => {
        (0, globals_1.expect)(typeof sendWelcomeEmail).toBe('function');
    });
});
(0, globals_1.describe)('sample', () => {
    (0, globals_1.it)('adds numbers', () => {
        (0, globals_1.expect)(1 + 1).toBe(2);
    });
});
