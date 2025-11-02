import crypto from 'crypto'

export function createToken(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function addMinutes(date: Date, minutes: number) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() + minutes)
  return d
}

// Generate 6-digit OTP
export function generateOTP(): string {
  const otp = crypto.randomInt(100000, 999999).toString()
  return otp
}

// Hash OTP for secure storage
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

// Verify OTP against hash
export function verifyOTP(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash
}
