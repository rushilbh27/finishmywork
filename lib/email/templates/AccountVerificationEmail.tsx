// Email-safe magic link verification email for FinishMyWork
// Accepts optional logoUrl to render a branded image at the top.
export function AccountVerificationEmail({ url, logoUrl }: { url: string; logoUrl?: string }) {
  const resolvedLogo =
    logoUrl ||
    process.env.EMAIL_LOGO_URL ||
    `${process.env.APP_URL || process.env.NEXTAUTH_URL || ''}/logo.svg`;
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your FinishMyWork account</title>
    <style>
      @media only screen and (max-width: 600px) {
        .container {
          padding: 20px 12px !important;
        }
        .card {
          border-radius: 12px !important;
        }
        .card-header {
          padding: 24px 20px 20px 20px !important;
        }
        .card-body {
          padding: 28px 20px 24px 20px !important;
        }
        .card-footer {
          padding: 18px 20px 28px 20px !important;
        }
        h1 {
          font-size: 20px !important;
        }
        .brand-title {
          font-size: 22px !important;
        }
        .logo {
          width: 64px !important;
          height: 64px !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0f;padding:40px 20px;" class="container">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:rgba(20,20,28,0.95);border:1px solid rgba(139,92,246,0.2);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);" class="card">
            <!-- Header with Logo and Branding -->
            <tr>
              <td style="padding:40px 40px 28px 40px;text-align:center;background:linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(219,39,119,0.08) 100%);" class="card-header">
                <h1 class="brand-title" style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">FinishMyWork</h1>
              </td>
            </tr>
            <!-- Body Content -->
            <tr>
              <td style="padding:36px 40px 32px 40px;text-align:center;" class="card-body">
                <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Confirm your email</h2>
                <p style="margin:0 0 32px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);">
                  Tap below to confirm your email and activate your FinishMyWork account.
                </p>
                <a href="${url}" style="display:inline-block;padding:16px 40px;margin:0;border-radius:12px;background:#8b5cf6;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;box-shadow:0 8px 32px rgba(139,92,246,0.4);">Verify email</a>
                <p style="margin:32px 0 0 0;font-size:14px;color:rgba(255,255,255,0.5);">If the button doesn't work, copy and paste this link:</p>
                <p style="word-break:break-all;font-size:13px;color:#8b5cf6;margin:12px 0 0 0;padding:12px;background:rgba(139,92,246,0.08);border-radius:8px;border:1px solid rgba(139,92,246,0.2);">${url}</p>
                <p style="margin:24px 0 0 0;font-size:13px;color:rgba(255,255,255,0.45);">🕐 Link expires in 15 minutes.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:24px 40px 36px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);" class="card-footer">
                <p style="margin:0 0 4px 0;font-size:13px;color:rgba(255,255,255,0.4);">
                  If you didn't request this, you can safely ignore this email.
                </p>
                <p style="margin:16px 0 0 0;font-size:14px;color:rgba(255,255,255,0.6);font-weight:600;">
                  — Team FinishMyWork
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}