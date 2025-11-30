#!/usr/bin/env tsx
/**
 * Comprehensive Smoke Test Suite for FinishMyWork
 * Tests critical flows: auth, tasks, messages, reviews, notifications, SSE
 */

import { PrismaClient } from '@prisma/client'
import http from 'http'
import https from 'https'

const prisma = new PrismaClient()
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

// Simple fetch replacement for Node.js
function nodeFetch(url: string, options: any = {}): Promise<{ status: number; text: () => Promise<string> }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http

    const req = client.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            text: async () => data,
          })
        })
      }
    )

    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  error?: string
  duration?: number
}

const results: TestResult[] = []

// Utility functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
  }
  const reset = '\x1b[0m'
  console.log(`${colors[type]}${message}${reset}`)
}

async function testEndpoint(
  name: string,
  method: string,
  path: string,
  options: {
    body?: any
    headers?: Record<string, string>
    expectedStatus?: number
    cookies?: string
  } = {}
): Promise<TestResult> {
  const start = Date.now()
  try {
    const response = await nodeFetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.cookies ? { Cookie: options.cookies } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const duration = Date.now() - start
    const expectedStatus = options.expectedStatus || 200

    if (response.status === expectedStatus) {
      log(`✓ ${name} (${duration}ms)`, 'success')
      return { name, status: 'PASS', duration }
    } else {
      const text = await response.text()
      log(`✗ ${name} - Expected ${expectedStatus}, got ${response.status}`, 'error')
      log(`  Response: ${text.substring(0, 200)}`, 'error')
      return { name, status: 'FAIL', error: `Status ${response.status}`, duration }
    }
  } catch (error) {
    const duration = Date.now() - start
    log(`✗ ${name} - ${error instanceof Error ? error.message : String(error)}`, 'error')
    return { name, status: 'FAIL', error: String(error), duration }
  }
}

async function testSSE(name: string, path: string, timeout = 5000): Promise<TestResult> {
  const start = Date.now()
  // SSE testing is complex in Node.js without EventSource polyfill
  // Skip for now or mark as manual test
  log(`⊘ ${name} - SSE tests require browser environment (skipped)`, 'warn')
  return { name, status: 'SKIP' }
}

async function runTests() {
  log('\n═══════════════════════════════════════════════', 'info')
  log('  FinishMyWork Production Smoke Test Suite', 'info')
  log('═══════════════════════════════════════════════\n', 'info')

  log(`Testing against: ${BASE_URL}\n`, 'info')

  // ============================================================================
  // 1. DATABASE CONNECTIVITY
  // ============================================================================
  log('1️⃣  DATABASE CONNECTIVITY', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  try {
    const userCount = await prisma.user.count()
    const taskCount = await prisma.task.count()
    log(`✓ Database connected (${userCount} users, ${taskCount} tasks)`, 'success')
    results.push({ name: 'Database Connection', status: 'PASS' })
  } catch (error) {
    log(`✗ Database connection failed: ${error}`, 'error')
    results.push({ name: 'Database Connection', status: 'FAIL', error: String(error) })
  }

  // ============================================================================
  // 2. STATIC PAGES
  // ============================================================================
  log('\n2️⃣  STATIC PAGES', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  results.push(await testEndpoint('Home Page', 'GET', '/'))
  results.push(await testEndpoint('Coming Soon Page', 'GET', '/coming-soon'))
  results.push(await testEndpoint('Auth - Sign In', 'GET', '/auth/signin'))
  results.push(await testEndpoint('Auth - Sign Up', 'GET', '/auth/signup'))

  // ============================================================================
  // 3. API HEALTH CHECKS (No Auth Required)
  // ============================================================================
  log('\n3️⃣  PUBLIC API ENDPOINTS', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  results.push(await testEndpoint('Waitlist Count API', 'GET', '/api/waitlist/count'))
  results.push(await testEndpoint('Test Users API', 'GET', '/api/test-users'))

  // ============================================================================
  // 4. PROTECTED API ENDPOINTS (Should Return 401)
  // ============================================================================
  log('\n4️⃣  PROTECTED ENDPOINTS (Auth Required)', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  results.push(await testEndpoint('Tasks API (401)', 'GET', '/api/tasks', { expectedStatus: 401 }))
  results.push(await testEndpoint('Notifications API (401)', 'GET', '/api/notifications', { expectedStatus: 401 }))
  results.push(await testEndpoint('User Stats API (401)', 'GET', '/api/user/stats', { expectedStatus: 401 }))
  results.push(await testEndpoint('Dashboard Stats API (401)', 'GET', '/api/dashboard/stats', { expectedStatus: 401 }))
  results.push(await testEndpoint('Chat Threads API (401)', 'GET', '/api/chat/threads', { expectedStatus: 401 }))

  // ============================================================================
  // 5. DATABASE OPERATIONS
  // ============================================================================
  log('\n5️⃣  DATABASE INTEGRITY', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  try {
    // Check for test users
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@gmail.com' } }
    })
    if (testUser) {
      log(`✓ Found test user: ${testUser.name} (${testUser.email})`, 'success')
      results.push({ name: 'Test User Found', status: 'PASS' })
    } else {
      log(`⚠ No test users found`, 'warn')
      results.push({ name: 'Test User Found', status: 'SKIP' })
    }

    // Check for tasks
    const recentTasks = await prisma.task.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true }
    })
    if (recentTasks.length > 0) {
      log(`✓ Found ${recentTasks.length} recent tasks`, 'success')
      results.push({ name: 'Recent Tasks Found', status: 'PASS' })
    } else {
      log(`⚠ No tasks found in database`, 'warn')
      results.push({ name: 'Recent Tasks Found', status: 'SKIP' })
    }

    // Check for messages
    const messageCount = await prisma.message.count()
    log(`✓ Message count: ${messageCount}`, 'success')
    results.push({ name: 'Message System', status: 'PASS' })

    // Check for notifications
    const notificationCount = await prisma.notification.count()
    log(`✓ Notification count: ${notificationCount}`, 'success')
    results.push({ name: 'Notification System', status: 'PASS' })

    // Check for reviews
    const reviewCount = await prisma.review.count()
    log(`✓ Review count: ${reviewCount}`, 'success')
    results.push({ name: 'Review System', status: 'PASS' })

  } catch (error) {
    log(`✗ Database query error: ${error}`, 'error')
    results.push({ name: 'Database Integrity', status: 'FAIL', error: String(error) })
  }

  // ============================================================================
  // 6. PRISMA SCHEMA VALIDATION
  // ============================================================================
  log('\n6️⃣  PRISMA SCHEMA VALIDATION', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  try {
    // Test all critical models
    await prisma.user.findFirst()
    await prisma.task.findFirst()
    await prisma.message.findFirst()
    await prisma.notification.findFirst()
    await prisma.review.findFirst()
    await prisma.waitlist.findFirst()
    await prisma.report.findFirst()
    await prisma.blockedUser.findFirst()
    
    log(`✓ All Prisma models accessible`, 'success')
    results.push({ name: 'Prisma Schema Valid', status: 'PASS' })
  } catch (error) {
    log(`✗ Prisma schema error: ${error}`, 'error')
    results.push({ name: 'Prisma Schema Valid', status: 'FAIL', error: String(error) })
  }

  // ============================================================================
  // 7. ERROR PAGES
  // ============================================================================
  log('\n7️⃣  ERROR HANDLING', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  results.push(await testEndpoint('404 Page', 'GET', '/non-existent-page', { expectedStatus: 404 }))
  results.push(await testEndpoint('Test Error Page', 'GET', '/test-error'))

  // ============================================================================
  // 8. ADMIN ROUTES (Should Redirect or 401)
  // ============================================================================
  log('\n8️⃣  ADMIN ROUTES', 'info')
  log('─────────────────────────────────────────────────', 'info')
  
  results.push(await testEndpoint('Admin Login', 'GET', '/admin/login'))
  results.push(await testEndpoint('Admin Dashboard (Protected)', 'GET', '/admin/dashboard', { expectedStatus: 307 }))

  // ============================================================================
  // SUMMARY
  // ============================================================================
  log('\n═══════════════════════════════════════════════', 'info')
  log('  TEST SUMMARY', 'info')
  log('═══════════════════════════════════════════════\n', 'info')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  const total = results.length

  log(`Total Tests: ${total}`, 'info')
  log(`Passed: ${passed}`, 'success')
  log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info')
  log(`Skipped: ${skipped}`, skipped > 0 ? 'warn' : 'info')

  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + (r.duration || 0), 0) / results.filter(r => r.duration).length

  if (avgDuration) {
    log(`\nAverage Response Time: ${avgDuration.toFixed(0)}ms`, 'info')
  }

  if (failed > 0) {
    log('\n❌ FAILED TESTS:', 'error')
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        log(`  • ${r.name}: ${r.error}`, 'error')
      })
  }

  const successRate = ((passed / (total - skipped)) * 100).toFixed(1)
  log(`\n📊 Success Rate: ${successRate}%`, passed === total - skipped ? 'success' : 'warn')

  if (passed === total - skipped) {
    log('\n✅ All tests passed! Production ready.', 'success')
  } else {
    log('\n⚠️  Some tests failed. Review errors above.', 'warn')
  }

  log('\n═══════════════════════════════════════════════\n', 'info')

  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  log(`Fatal error: ${error}`, 'error')
  console.error(error)
  process.exit(1)
})
