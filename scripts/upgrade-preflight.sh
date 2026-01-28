#!/usr/bin/env bash
set -euo pipefail

# Pre-flight Check Script
# Verifies system is ready for dependency upgrades

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pre-Flight Upgrade Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

check_pass() {
  echo -e "  ${GREEN}✓${NC} $1"
  ((CHECKS_PASSED++))
}

check_fail() {
  echo -e "  ${RED}✗${NC} $1"
  ((CHECKS_FAILED++))
}

check_warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

# Check 1: Git Status
echo "1. Git Repository Status"
if git diff --quiet && git diff --cached --quiet; then
  check_pass "No uncommitted changes"
else
  check_warn "Uncommitted changes detected"
  echo "     Run: git status"
fi

if git branch --show-current | grep -q "main\|master"; then
  check_warn "Currently on main/master branch"
  echo "     Recommendation: Create upgrade branch first"
  echo "     Run: git checkout -b upgrade/security-fixes"
else
  check_pass "On feature branch: $(git branch --show-current)"
fi
echo ""

# Check 2: Node.js & pnpm
echo "2. Runtime Environment"
NODE_VERSION=$(node --version)
PNPM_VERSION=$(pnpm --version)
echo "  Node.js: $NODE_VERSION"
echo "  pnpm: $PNPM_VERSION"

if [[ "$NODE_VERSION" =~ ^v(18|20|22)\. ]]; then
  check_pass "Node.js version compatible"
else
  check_fail "Node.js version may be incompatible (need >=18)"
fi

if [[ "$PNPM_VERSION" =~ ^(9|10)\. ]]; then
  check_pass "pnpm version compatible"
else
  check_warn "pnpm version may be incompatible (need >=9)"
fi
echo ""

# Check 3: Baseline Tests
echo "3. Baseline Test Status"
echo "  Running test suite..."
if pnpm test >/dev/null 2>&1; then
  check_pass "All tests passing (clean baseline)"
else
  check_fail "Tests failing - FIX BEFORE UPGRADING"
  echo "     Run: pnpm test"
  echo "     Fix failing tests to establish clean baseline"
fi
echo ""

# Check 4: Build Status
echo "4. Build Status"
echo "  Running build..."
if pnpm build >/dev/null 2>&1; then
  check_pass "All packages build successfully"
else
  check_fail "Build failing - FIX BEFORE UPGRADING"
  echo "     Run: pnpm build"
fi
echo ""

# Check 5: Type Checking
echo "5. Type Checking"
echo "  Running type check..."
if pnpm type-check >/dev/null 2>&1; then
  check_pass "No TypeScript errors"
else
  check_warn "TypeScript errors detected"
  echo "     Run: pnpm type-check"
fi
echo ""

# Check 6: Security Vulnerabilities
echo "6. Security Status"
VULN_COUNT=$(pnpm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0' || echo "unknown")
if [ "$VULN_COUNT" == "0" ]; then
  check_pass "No security vulnerabilities"
elif [ "$VULN_COUNT" == "unknown" ]; then
  check_warn "Could not determine vulnerability count"
else
  check_warn "$VULN_COUNT security vulnerabilities found"
  echo "     Run: pnpm audit"
  echo "     Phase 1 will fix these"
fi
echo ""

# Check 7: Disk Space
echo "7. Disk Space"
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "  Available: $AVAILABLE_SPACE"
if df -h . | awk 'NR==2 {gsub(/[^0-9]/, "", $4); if ($4 > 5) exit 0; else exit 1}'; then
  check_pass "Sufficient disk space"
else
  check_warn "Low disk space (need >5GB recommended)"
fi
echo ""

# Check 8: Documentation
echo "8. Documentation Readiness"
if [ -f "UPGRADE_PLAN.md" ]; then
  check_pass "UPGRADE_PLAN.md exists"
else
  check_fail "UPGRADE_PLAN.md not found"
fi

if [ -f "UPGRADE_CHECKLIST.md" ]; then
  check_pass "UPGRADE_CHECKLIST.md exists"
else
  check_fail "UPGRADE_CHECKLIST.md not found"
fi

if [ -f ".claude/dependency-compatibility-matrix.md" ]; then
  check_pass "Compatibility matrix exists"
else
  check_fail "Compatibility matrix not found"
fi
echo ""

# Check 9: Scripts
echo "9. Upgrade Scripts"
if [ -x "scripts/upgrade-phase1-security.sh" ]; then
  check_pass "Phase 1 script ready"
else
  check_fail "Phase 1 script not executable"
  echo "     Run: chmod +x scripts/upgrade-phase1-security.sh"
fi

if [ -x "scripts/upgrade-rollback.sh" ]; then
  check_pass "Rollback script ready"
else
  check_warn "Rollback script not executable"
  echo "     Run: chmod +x scripts/upgrade-rollback.sh"
fi
echo ""

# Check 10: Backup Tags
echo "10. Backup Strategy"
if git tag -l "pre-upgrade-*" | grep -q .; then
  LATEST_BACKUP=$(git tag -l "pre-upgrade-*" | tail -n 1)
  check_pass "Backup tags exist (latest: $LATEST_BACKUP)"
else
  check_warn "No pre-upgrade backup tags"
  echo "     Create: git tag pre-upgrade-\$(date +%Y%m%d)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}✓ Passed:${NC}  $CHECKS_PASSED"
echo -e "  ${RED}✗ Failed:${NC}  $CHECKS_FAILED"
echo -e "  ${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo ""

# Recommendations
if [ $CHECKS_FAILED -gt 0 ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}⚠  NOT READY FOR UPGRADE${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Required actions before upgrading:"
  echo "  1. Fix failing tests: pnpm test"
  echo "  2. Fix build errors: pnpm build"
  echo "  3. Ensure all documentation exists"
  echo ""
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠  READY WITH WARNINGS${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Recommended actions before upgrading:"
  echo "  1. Review warnings above"
  echo "  2. Create backup tag: git tag pre-upgrade-\$(date +%Y%m%d)"
  echo "  3. Create upgrade branch: git checkout -b upgrade/security-fixes"
  echo ""
  echo "When ready:"
  echo "  ./scripts/upgrade-phase1-security.sh"
  echo ""
  exit 0
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✓ READY FOR UPGRADE${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "System is ready for dependency upgrades."
  echo ""
  echo "Next steps:"
  echo "  1. Review plan: cat UPGRADE_PLAN.md"
  echo "  2. Create backup: git tag pre-upgrade-\$(date +%Y%m%d)"
  echo "  3. Create branch: git checkout -b upgrade/security-fixes"
  echo "  4. Execute Phase 1: ./scripts/upgrade-phase1-security.sh"
  echo ""
  exit 0
fi
