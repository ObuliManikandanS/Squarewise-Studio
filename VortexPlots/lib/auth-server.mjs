import {betterAuth} from 'better-auth';
import {database} from './database.mjs';

export const mailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
async function sendAccountMail(to, subject, url) {
  if (!mailReady()) throw new Error('Email delivery is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({from: process.env.EMAIL_FROM, to: [to], subject, text: `${subject}\n\n${url}\n\nIf you did not request this, ignore this email.`}),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Email delivery failed. Try again later.');
}

/** @returns {import('better-auth').BetterAuthOptions} */
export function authOptions() {
  const baseURL = process.env.BETTER_AUTH_URL || process.env.RENDER_EXTERNAL_URL;
  if (!baseURL || !process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('AUTH_NOT_CONFIGURED');
  }
  return {
    appName: 'VortexPlots', baseURL, secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [new URL(baseURL).origin], database: database(),
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 128, autoSignIn: false,
      requireEmailVerification: mailReady(), revokeSessionsOnPasswordReset: true,
      ...(mailReady() ? {sendResetPassword: async ({user, url}) => sendAccountMail(user.email, 'Reset your VortexPlots password', url)} : {}),
    },
    ...(mailReady() ? {emailVerification: {sendOnSignUp: true, sendVerificationEmail: async ({user, url}) => sendAccountMail(user.email, 'Verify your VortexPlots email', url)}} : {}),
    session: {expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24},
    rateLimit: {enabled: true, storage: 'database', window: 60, max: 60,
      customRules: {'/sign-in/email': {window: 60, max: 5}, '/sign-up/email': {window: 60, max: 3}, '/request-password-reset': {window: 60, max: 3}}},
  };
}
/** @type {ReturnType<typeof betterAuth> | undefined} */
let auth;
export function getAuth() { return auth ??= betterAuth(authOptions()); }
