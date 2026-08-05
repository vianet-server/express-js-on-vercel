"use strict";
/**
 * services/email/verification.ts
 *
 * Email-verification flow helpers: builds the one-time verification token +
 * callback URL and sends the verification + welcome emails via the Resend-backed
 * service in ./index.
 *
 * Env:
 *   JWT_SECRET        (signs the verification token)
 *   APP_URL / SITE_URL (base URL for the verification link, e.g. https://vianet.co.in)
 *
 * The token payload carries { email, purpose: 'verify' } and expires in 24h.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendWelcomeEmail } = require('./index');
const VERIFY_PATH = '/verify-email';
/**
 * Sign a one-time email-verification token.
 * @param {object} input
 * @param {string} input.email - address being verified
 * @param {string} [input.userId] - optional id embedded in the token
 * @returns {string} JWT valid for 24h
 */
function createVerificationToken({ email, userId }) {
    return jwt.sign({ email, purpose: 'verify', ...(userId ? { userId } : {}) }, process.env.JWT_SECRET, { expiresIn: '24h' });
}
/**
 * Verify a previously issued verification token.
 * @param {string} token
 * @returns {{ valid: boolean, email?: string, userId?: string, reason?: string }}
 */
function verifyEmailToken(token) {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.purpose !== 'verify') {
            return { valid: false, reason: 'invalid purpose' };
        }
        return { valid: true, email: payload.email, userId: payload.userId };
    }
    catch (err) {
        return { valid: false, reason: 'expired or invalid token' };
    }
}
/**
 * Build the absolute verification URL (with token) that the email links to.
 * @param {string} token - signed verification JWT
 * @returns {string} e.g. https://vianet.co.in/verify-email?token=...
 */
function buildVerificationUrl(token) {
    const base = (process.env.APP_URL || process.env.SITE_URL || '').replace(/\/+$/, '');
    if (!base)
        return `${VERIFY_PATH}?token=${encodeURIComponent(token)}`;
    return `${base}${VERIFY_PATH}?token=${encodeURIComponent(token)}`;
}
/**
 * Create a verification token + URL and email it to the user.
 * @param {object} input
 * @param {string} input.to - recipient email
 * @param {string} [input.name]
 * @param {string|number} [input.userId]
 * @returns {Promise<{token: string, verificationUrl: string, result: {data: object|null, error: object|null}}>}
 */
async function sendUserVerification({ to, name, userId }) {
    const token = createVerificationToken({ email: to, userId });
    const verificationUrl = buildVerificationUrl(token);
    const result = await sendVerificationEmail({ to, name, email: to, verificationUrl });
    return { token, verificationUrl, result };
}
/**
 * Send the welcome email after the account is verified/created.
 * @param {object} input
 * @param {string} input.to
 * @param {string} [input.name]
 * @param {string} [input.loginUrl]
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function sendUserWelcome({ to, name, loginUrl }) {
    return sendWelcomeEmail({ to, name, email: to, loginUrl });
}
module.exports = {
    createVerificationToken,
    verifyEmailToken,
    buildVerificationUrl,
    sendUserVerification,
    sendUserWelcome,
};
