# Enable production recovery email

The app uses Resend through HTTPS. No SMTP port is required.

1. In Resend, verify a sender domain you control and create a sending API key for that domain.
2. In the existing VortexPlots Render service, open **Environment** and set:
   - `RESEND_API_KEY`: the Resend sending key (secret).
   - `EMAIL_FROM`: `VortexPlots <no-reply@YOUR_VERIFIED_DOMAIN>` using the actual verified domain.
3. Save and redeploy. Keep `DATABASE_URL`, `BETTER_AUTH_SECRET` and the existing public URL unchanged.
4. Visit `/forgot-password`, request a link for your own existing account, check the inbox/spam folder, and complete the reset. Confirm the old password no longer works.
5. Verify a new account or use `/verify-email` to resend verification. When mail is configured, existing unverified accounts also receive verification on sign-in.

Do not paste API keys into chat, screenshots, source files or commits. The public `/api/me` endpoint reports capability flags only, never credentials. Flags indicate configuration; an actual inbox test is needed to establish delivery.

Recovery links expire after 30 minutes and are single-use. Verification links expire after one hour. Recovery revokes previous sessions. Unknown addresses get the same neutral recovery response. Email-provider failures are not presented as successful delivery.

The `.onrender.com` address is the application host, not a sender domain you can verify for email. Use a domain you control. Provider test senders are insufficient for recovery to arbitrary users.

## Isolated checks

After installing temporary QA dependencies as described in `QA-RELEASE.md`, run `node scripts/email-recovery-qa.mjs`. This runs real Better Auth flows and PostgreSQL-backed token storage against an intercepted email transport. No external email is sent; production delivery still requires the inbox check above.
