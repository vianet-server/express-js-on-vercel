/**
 * services/email/index.ts
 *
 * Single transactional email service backed by Resend.
 * Sends the "welcome-email" template whenever a user signs in.
 *
 * Env:
 *   RESEND_API_KEY  (required to send; service degrades gracefully if missing)
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

let _welcomeTemplateId = null;

/**
 * Resolve the Resend template id for 'welcome-email' (cached).
 * @returns {Promise<string>} the template id
 */
async function getWelcomeTemplateId() {
  if (_welcomeTemplateId) return _welcomeTemplateId;
  const { data, error } = await resend.templates.get('welcome-email');
  if (error) throw error;
  if (!data || !data.id) throw new Error('Resend template "welcome-email" not found');
  _welcomeTemplateId = data.id;
  return data.id;
}

/**
 * Send the welcome email using the Resend "welcome-email" template.
 * @param {object} input
 * @param {string} input.to - recipient email address
 * @returns {Promise<{data: object|null, error: object|null}>} Resend's send result
 */
async function sendWelcomeEmail({ to }) {
  if (!resend) {
    return { data: null, error: { message: 'RESEND_API_KEY is not configured' } };
  }
  try {
    const templateId = await getWelcomeTemplateId();
    return await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [to],
      subject: 'Thanks for your order!',
      template: { id: templateId },
    });
  } catch (err) {
    return { data: null, error: err };
  }
}

module.exports = { sendWelcomeEmail };
