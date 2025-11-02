import { authenticator } from 'otplib'

export function generateTOTPSecret(labelEmail: string, issuer = 'FinishMyWork') {
  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(labelEmail, issuer, secret)
  return { secret, otpauth }
}

export function verifyTOTP(token: string, secret: string) {
  return authenticator.verify({ token, secret })
}
