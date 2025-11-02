/**
 * Test script for OTP email system
 * Run with: npx ts-node scripts/test-otp-email.ts
 */

import { VerificationEmail } from '../lib/email/templates/VerificationEmail'
import { PasswordResetEmail } from '../lib/email/templates/PasswordResetEmail'
import { generateOTP } from '../lib/tokens'
import * as fs from 'fs'
import * as path from 'path'

console.log('🧪 Testing OTP Email System\n')

// Generate test OTPs
const verificationOTP = generateOTP()
const passwordResetOTP = generateOTP()

console.log('✅ Generated OTPs:')
console.log(`   Verification: ${verificationOTP}`)
console.log(`   Password Reset: ${passwordResetOTP}\n`)

// Generate HTML emails
const verificationHTML = VerificationEmail({ otp: verificationOTP })
const passwordResetHTML = PasswordResetEmail({ otp: passwordResetOTP })

// Save to files for preview
const outputDir = path.join(__dirname, '../.temp-email-previews')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const verificationPath = path.join(outputDir, 'verification-email.html')
const passwordResetPath = path.join(outputDir, 'password-reset-email.html')

fs.writeFileSync(verificationPath, verificationHTML)
fs.writeFileSync(passwordResetPath, passwordResetHTML)

console.log('✅ Email HTML generated successfully:')
console.log(`   📧 Verification: ${verificationPath}`)
console.log(`   📧 Password Reset: ${passwordResetPath}\n`)

console.log('🎨 Email Preview:')
console.log('   Open the HTML files in a browser to preview the emails.\n')

console.log('📋 Email Details:')
console.log('   Brand: FinishMyWork')
console.log('   OTP Length: 6 digits')
console.log('   Expiry: 10 minutes')
console.log('   Storage: OTP hashed with SHA-256')
console.log('   Subject (Verification): "Your FinishMyWork verification code"')
console.log('   Subject (Password Reset): "Your FinishMyWork verification code"')
console.log('   Signature: "— Team FinishMyWork"\n')

console.log('✨ OTP Email System Ready!')
