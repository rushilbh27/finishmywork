// Email-safe OTP verification email for FinishMyWork
export function VerificationEmail({ otp }: { otp: string }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your FinishMyWork verification code</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0f;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:rgba(20,20,28,0.95);border:1px solid rgba(139,92,246,0.2);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
            
            <!-- Header -->
            <tr>
              <td style="padding:40px 40px 32px 40px;text-align:center;background:linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(219,39,119,0.15) 100%);">
                <div style="width:56px;height:56px;margin:0 auto 16px auto;background:linear-gradient(135deg, #8b5cf6 0%, #db2777 100%);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(139,92,246,0.3);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">FinishMyWork</h1>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding:40px 40px 32px 40px;text-align:center;">
                <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">Verification Code</h2>
                <p style="margin:0 0 32px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.65);">
                  Your secure verification code is:
                </p>
                
                <!-- OTP Box -->
                <div style="margin:0 auto 32px auto;max-width:280px;padding:24px 32px;background:rgba(139,92,246,0.08);border:1.5px solid rgba(139,92,246,0.25);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.2);">
                  <div style="font-size:42px;font-weight:700;color:#ffffff;letter-spacing:8px;font-family:'Courier New',monospace;">${otp}</div>
                </div>
                
                <p style="margin:0 0 8px 0;font-size:14px;color:rgba(255,255,255,0.5);">
                  This code expires in <strong style="color:rgba(255,255,255,0.75);">10 minutes</strong>
                </p>
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.5);">
                  Do not share this code with anyone.
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding:24px 40px 40px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0 0 4px 0;font-size:13px;color:rgba(255,255,255,0.4);">
                  If you didn't request this code, please ignore this email.
                </p>
                <p style="margin:12px 0 0 0;font-size:13px;color:rgba(255,255,255,0.5);font-weight:500;">
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
