# Auth Email Verification, Password Reset, and 2FA (Scaffold)

This repo now includes:

- SMTP email via Nodemailer (lib/email.ts) using .env SMTP_* variables
- Email verification endpoints
- Password reset endpoints with hashed tokens
- 2FA helper scaffold (otplib)
- API guards so task mutations require verified email

## Endpoints

- POST /api/auth/email/verify/request { email }
- POST /api/auth/email/verify { email, token }
- POST /api/auth/password/reset/request { email }
- POST /api/auth/password/reset/confirm { email, token, newPassword }

## Notes

- Minimal in-memory rate limit per IP (5 per 15 minutes) on token endpoints
- Tokens are random hex; verification tokens are hashed and stored on User
- Password reset tokens stored hashed in PasswordResetToken table (Prisma)
- 2FA is scaffolded only (lib/2fa.ts), not wired into login yet
- Task POST/accept/complete/unassign endpoints return 403 if email not verified

## Environment

Update .env with:

APP_URL=https://your-domain.com
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_SECURE=false
SMTP_FROM="FinishMyWork <no-reply@your-domain.com>"

## Testing

1) Email verification
- POST /api/auth/email/verify/request { email }
- Click link from email (or copy token/email) and POST /api/auth/email/verify

2) Password reset
- POST /api/auth/password/reset/request { email }
- Use link token to POST /api/auth/password/reset/confirm { email, token, newPassword }

3) Guards
- Temporarily set a test user's emailVerified to null and hit task mutation endpoints; expect 403 JSON
