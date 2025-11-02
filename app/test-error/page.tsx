'use client'

export default function TestErrorPage() {
  throw new Error('Testing error boundary')
  return null
}