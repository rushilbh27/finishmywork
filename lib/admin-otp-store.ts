type OTPRecord = {
  hash: string
  expiresAt: number
}

class AdminOtpStore {
  private store: Map<string, OTPRecord>

  constructor() {
    if (!(global as any).__ADMIN_OTP_STORE__) {
      ;(global as any).__ADMIN_OTP_STORE__ = new Map<string, OTPRecord>()
    }
    this.store = (global as any).__ADMIN_OTP_STORE__
  }

  set(key: string, record: OTPRecord) {
    this.store.set(key, record)
  }

  get(key: string) {
    return this.store.get(key)
  }

  delete(key: string) {
    this.store.delete(key)
  }
}

export const adminOtpStore = new AdminOtpStore()
