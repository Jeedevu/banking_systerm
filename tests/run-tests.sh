#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# Banking Management System - Integration Test Suite
# ──────────────────────────────────────────────────────────────────

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

function test_case() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))
  
  if echo "$actual" | grep -q "$expected"; then
    echo -e "  ${GREEN}✓ PASS${NC}: $name"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗ FAIL${NC}: $name"
    echo -e "    Expected: $expected"
    echo -e "    Got: $actual"
    FAIL=$((FAIL + 1))
  fi
}

function test_case_not() {
  local name="$1"
  local not_expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))
  
  if echo "$actual" | grep -q "$not_expected"; then
    echo -e "  ${RED}✗ FAIL${NC}: $name (found unexpected: $not_expected)"
    FAIL=$((FAIL + 1))
  else
    echo -e "  ${GREEN}✓ PASS${NC}: $name"
    PASS=$((PASS + 1))
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Banking Management System - Test Suite"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Seed Database ───────────────────────────────────────────────
echo -e "${YELLOW}[Setup]${NC} Seeding database..."
SEED_RESULT=$(curl -s -X POST "$BASE_URL/api/seed")
echo "  Seed: $SEED_RESULT"
echo ""

# ── 1. AUTHENTICATION TESTS ────────────────────────────────────
echo -e "${YELLOW}[1] Authentication Tests${NC}"

# Test 1.1: Successful customer login
RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"customer123"}')
test_case "Customer login succeeds" "Login successful" "$RESULT"

# Test 1.2: Successful admin login
RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
test_case "Admin login succeeds" "Login successful" "$RESULT"

# Test 1.3: Invalid login - wrong password
RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"wrongpassword"}')
test_case "Invalid password rejected" "Invalid username or password" "$RESULT"

# Test 1.4: Invalid login - non-existent user
RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"nonexistent","password":"password"}')
test_case "Non-existent user rejected" "Invalid username or password" "$RESULT"

# Test 1.5: Registration - new user
TIMESTAMP=$(date +%s)
RESULT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser_$TIMESTAMP\",\"password\":\"test123\",\"fullName\":\"Test User\",\"dateOfBirth\":\"2000-01-01\",\"phone\":\"1234567890\",\"email\":\"test_$TIMESTAMP@example.com\",\"address\":\"Test Address\",\"accountType\":\"savings\"}")
test_case "New user registration succeeds" "Registration successful" "$RESULT"

# Test 1.6: Duplicate username registration
RESULT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"test123","fullName":"John Duplicate","dateOfBirth":"2000-01-01","phone":"1234567890","email":"unique_email@example.com","address":"Test Address","accountType":"savings"}')
test_case "Duplicate username rejected" "already exists" "$RESULT"

echo ""

# ── Get session cookies ────────────────────────────────────────
CUSTOMER_COOKIE=$(curl -s -c - -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"customer123"}' | grep banking_session | awk '{print $NF}')

ADMIN_COOKIE=$(curl -s -c - -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep banking_session | awk '{print $NF}')

# ── 2. DEPOSIT TESTS ──────────────────────────────────────────
echo -e "${YELLOW}[2] Deposit Tests${NC}"

# Test 2.1: Successful deposit
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/deposit" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":5000,"description":"Test deposit"}')
test_case "Deposit succeeds" "Deposit successful" "$RESULT"

# Test 2.2: Deposit with zero amount
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/deposit" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":0}')
test_case "Zero deposit rejected" "must be greater than zero" "$RESULT"

# Test 2.3: Deposit with negative amount
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/deposit" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":-100}')
test_case "Negative deposit rejected" "must be greater than zero" "$RESULT"

echo ""

# ── 3. WITHDRAWAL TESTS ───────────────────────────────────────
echo -e "${YELLOW}[3] Withdrawal Tests${NC}"

# Test 3.1: Successful withdrawal
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":1000,"description":"Test withdrawal"}')
test_case "Withdrawal succeeds" "Withdrawal successful" "$RESULT"

# Test 3.2: Insufficient balance
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":999999}')
test_case "Insufficient balance rejected" "Insufficient balance" "$RESULT"

# Test 3.3: Withdrawal with zero amount
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":0}')
test_case "Zero withdrawal rejected" "must be greater than zero" "$RESULT"

echo ""

# ── 4. TRANSFER TESTS ─────────────────────────────────────────
echo -e "${YELLOW}[4] Transfer Tests${NC}"

# Test 4.1: Successful transfer
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/transfer" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"toAccountNumber":"ACC00000003","amount":500,"description":"Test transfer"}')
test_case "Transfer to active account succeeds" "Transfer successful" "$RESULT"

# Test 4.2: Transfer to inactive account
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/transfer" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"toAccountNumber":"ACC00000004","amount":500}')
test_case "Transfer to inactive account rejected" "inactive" "$RESULT"

# Test 4.3: Transfer to non-existent account
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/transfer" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"toAccountNumber":"ACC99999999","amount":500}')
test_case "Transfer to non-existent account rejected" "not found" "$RESULT"

# Test 4.4: Transfer exceeding balance
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/transfer" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"toAccountNumber":"ACC00000003","amount":999999}')
test_case "Transfer exceeding balance rejected" "Insufficient balance" "$RESULT"

echo ""

# ── 5. AUTHORIZATION TESTS ────────────────────────────────────
echo -e "${YELLOW}[5] Authorization Tests${NC}"

# Test 5.1: Unauthorized access to customer dashboard
RESULT=$(curl -s "$BASE_URL/api/customer/dashboard")
test_case "Unauthorized customer dashboard access rejected" "Unauthorized" "$RESULT"

# Test 5.2: Customer cannot access admin dashboard
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" "$BASE_URL/api/admin/dashboard")
test_case "Customer cannot access admin dashboard" "Forbidden" "$RESULT"

# Test 5.3: Admin cannot access customer operations
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" -X POST "$BASE_URL/api/customer/deposit" \
  -H "Content-Type: application/json" \
  -d '{"accountId":1,"amount":100}')
test_case "Admin cannot perform customer deposit" "Forbidden" "$RESULT"

echo ""

# ── 6. TRANSACTION TESTS ──────────────────────────────────────
echo -e "${YELLOW}[6] Transaction History Tests${NC}"

# Test 6.1: Customer can view transactions
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" "$BASE_URL/api/customer/transactions")
test_case "Customer can view transactions" "transactions" "$RESULT"

# Test 6.2: Customer can filter transactions by type
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" "$BASE_URL/api/customer/transactions?type=deposit")
test_case "Customer can filter transactions by type" "transactions" "$RESULT"

echo ""

# ── 7. ADMIN TESTS ────────────────────────────────────────────
echo -e "${YELLOW}[7] Admin Tests${NC}"

# Test 7.1: Admin can view dashboard
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" "$BASE_URL/api/admin/dashboard")
test_case "Admin can view dashboard" "totalCustomers" "$RESULT"

# Test 7.2: Admin can view all customers
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" "$BASE_URL/api/admin/customers")
test_case "Admin can view customers" "customers" "$RESULT"

# Test 7.3: Admin can view all accounts
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" "$BASE_URL/api/admin/accounts")
test_case "Admin can view accounts" "accounts" "$RESULT"

# Test 7.4: Admin can view all transactions
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" "$BASE_URL/api/admin/transactions")
test_case "Admin can view transactions" "transactions" "$RESULT"

# Test 7.5: Admin can deactivate account
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" -X POST "$BASE_URL/api/admin/accounts/2/toggle" \
  -H "Content-Type: application/json" \
  -d '{"status":"inactive"}')
test_case "Admin can deactivate account" "deactivated" "$RESULT"

# Test 7.6: Admin can reactivate account
RESULT=$(curl -s -b "banking_session=$ADMIN_COOKIE" -X POST "$BASE_URL/api/admin/accounts/2/toggle" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}')
test_case "Admin can reactivate account" "activated" "$RESULT"

echo ""

# ── 8. INACTIVE ACCOUNT TESTS ─────────────────────────────────
echo -e "${YELLOW}[8] Inactive Account Tests${NC}"

# Deactivate an account first
curl -s -b "banking_session=$ADMIN_COOKIE" -X POST "$BASE_URL/api/admin/accounts/2/toggle" \
  -H "Content-Type: application/json" -d '{"status":"inactive"}' > /dev/null

# Test 8.1: Cannot deposit to inactive account
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/deposit" \
  -H "Content-Type: application/json" \
  -d '{"accountId":2,"amount":100}')
test_case "Deposit to inactive account rejected" "inactive" "$RESULT"

# Test 8.2: Cannot withdraw from inactive account
RESULT=$(curl -s -b "banking_session=$CUSTOMER_COOKIE" -X POST "$BASE_URL/api/customer/withdraw" \
  -H "Content-Type: application/json" \
  -d '{"accountId":2,"amount":100}')
test_case "Withdrawal from inactive account rejected" "inactive" "$RESULT"

# Reactivate for cleanup
curl -s -b "banking_session=$ADMIN_COOKIE" -X POST "$BASE_URL/api/admin/accounts/2/toggle" \
  -H "Content-Type: application/json" -d '{"status":"active"}' > /dev/null

echo ""

# ── RESULTS ────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
if [ $FAIL -eq 0 ]; then
  echo -e "\n  ${GREEN}All tests passed! ✓${NC}"
else
  echo -e "\n  ${RED}$FAIL test(s) failed! ✗${NC}"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""

exit $FAIL
