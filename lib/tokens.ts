import crypto from 'crypto'

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function hashOTP(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export function verifyOTP(otp: string, hash: string) {
  const otpHash = hashOTP(otp)
  return otpHash === hash
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000)
}

export function createToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
