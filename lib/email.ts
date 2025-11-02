import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!process.env.SMTP_FROM) throw new Error('SMTP_FROM missing')
  const fromAddress = process.env.SMTP_FROM
  const from = /<.*>/.test(fromAddress) ? fromAddress : `"FinishMyWork" <${fromAddress}>`
  return transporter.sendMail({
    from,
    ...opts,
  })
}
