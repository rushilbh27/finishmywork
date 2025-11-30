#!/bin/bash

# FinishMyWork Production Smoke Test Suite
# Tests critical endpoints and flows

BASE_URL="${BASE_URL:-http://localhost:3001}"
PASSED=0
FAILED=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${CYAN}$1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

test_endpoint() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_status="${4:-200}"
  
  TOTAL=$((TOTAL + 1))
  
  local status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "${BASE_URL}${path}")
  
  if [ "$status" = "$expected_status" ]; then
    log_success "$name (HTTP $status)"
    PASSED=$((PASSED + 1))
    return 0
  else
    log_error "$name - Expected $expected_status, got $status"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

test_json_response() {
  local name="$1"
  local path="$2"
  
  TOTAL=$((TOTAL + 1))
  
  local response=$(curl -s "${BASE_URL}${path}")
  
  if echo "$response" | jq . >/dev/null 2>&1; then
    log_success "$name (Valid JSON)"
    PASSED=$((PASSED + 1))
    echo "  Response: $(echo "$response" | jq -c . | head -c 100)..."
    return 0
  else
    log_error "$name - Invalid JSON response"
    echo "  Response: ${response:0:100}..."
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# ============================================================================
# START TEST SUITE
# ============================================================================

echo ""
log_info "═══════════════════════════════════════════════"
log_info "  FinishMyWork Production Smoke Test Suite"
log_info "═══════════════════════════════════════════════"
echo ""
log_info "Testing against: $BASE_URL"
echo ""

# ============================================================================
# 1. SERVER HEALTH
# ============================================================================
log_info "1️⃣  SERVER HEALTH"
log_info "─────────────────────────────────────────────────"

test_endpoint "Server Running (Redirects to Coming Soon)" "GET" "/" "307"
test_endpoint "Coming Soon Page" "GET" "/coming-soon" "200"

echo ""

# ============================================================================
# 2. PUBLIC PAGES
# ============================================================================
log_info "2️⃣  PUBLIC PAGES"
log_info "─────────────────────────────────────────────────"

test_endpoint "Sign In Page" "GET" "/auth/signin" "200"
test_endpoint "Sign Up Page" "GET" "/auth/signup" "200"
test_endpoint "Forgot Password" "GET" "/auth/forgot-password" "200"
test_endpoint "2FA Page" "GET" "/auth/2fa" "200"

echo ""

# ============================================================================
# 3. PUBLIC API ENDPOINTS
# ============================================================================
log_info "3️⃣  PUBLIC API ENDPOINTS"
log_info "─────────────────────────────────────────────────"

test_json_response "Waitlist Count API" "/api/waitlist/count"
test_json_response "Test Users API" "/api/test-users"

echo ""

# ============================================================================
# 4. PROTECTED ENDPOINTS (Should Return 401)
# ============================================================================
log_info "4️⃣  PROTECTED ENDPOINTS (Auth Required)"
log_info "─────────────────────────────────────────────────"

test_endpoint "Tasks API (Public Browse)" "GET" "/api/tasks" "200"
test_endpoint "Notifications API (401)" "GET" "/api/notifications" "401"
test_endpoint "User Stats API (401)" "GET" "/api/user/stats" "401"
test_endpoint "Dashboard Stats API (401)" "GET" "/api/dashboard/stats" "401"
test_endpoint "Chat Threads API (401)" "GET" "/api/chat/threads" "401"
test_endpoint "Messages API (401)" "GET" "/api/messages" "401"

echo ""

# ============================================================================
# 5. ADMIN ROUTES (Should Redirect or Require Auth)
# ============================================================================
log_info "5️⃣  ADMIN ROUTES"
log_info "─────────────────────────────────────────────────"

test_endpoint "Admin Login Page" "GET" "/admin/login" "200"
test_endpoint "Admin Dashboard (Protected)" "GET" "/admin/dashboard" "307"

echo ""

# ============================================================================
# 6. ERROR HANDLING
# ============================================================================
log_info "6️⃣  ERROR HANDLING"
log_info "─────────────────────────────────────────────────"

test_endpoint "404 Page" "GET" "/non-existent-route" "404"

echo ""

# ============================================================================
# 7. STATIC ASSETS
# ============================================================================
log_info "7️⃣  STATIC ASSETS"
log_info "─────────────────────────────────────────────────"

test_endpoint "Favicon" "GET" "/favicon.ico" "200"

echo ""

# ============================================================================
# 8. API ROUTE VALIDATION
# ============================================================================
log_info "8️⃣  API ROUTE VALIDATION"
log_info "─────────────────────────────────────────────────"

# Reviews API requires userId param, returns 400 without it (expected)
test_endpoint "Reviews API (Requires userId param)" "GET" "/api/reviews" "400"
test_endpoint "Reports API (401)" "GET" "/api/reports" "401"

# Test invalid routes
test_endpoint "Invalid API Route (404)" "GET" "/api/invalid-route" "404"

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
log_info "═══════════════════════════════════════════════"
log_info "  TEST SUMMARY"
log_info "═══════════════════════════════════════════════"
echo ""

log_info "Total Tests: $TOTAL"
log_success "Passed: $PASSED"

if [ $FAILED -gt 0 ]; then
  log_error "Failed: $FAILED"
else
  log_info "Failed: $FAILED"
fi

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
log_info ""
log_info "📊 Success Rate: ${SUCCESS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
  log_success "✅ All tests passed! Production ready."
  echo ""
  exit 0
else
  log_warn "⚠️  Some tests failed. Review errors above."
  echo ""
  exit 1
fi
