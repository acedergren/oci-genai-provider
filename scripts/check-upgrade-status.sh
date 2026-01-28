#!/usr/bin/env bash
set -euo pipefail

# Check Upgrade Status
# Displays current dependency versions and upgrade opportunities

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
echo "Dependency Upgrade Status Report"
echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Security Vulnerabilities
echo ""
echo -e "${RED}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
echo -e "${RED}┃  SECURITY VULNERABILITIES                                ┃${NC}"
echo -e "${RED}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"
pnpm audit --json 2>/dev/null | jq -r '
  if .metadata then
    "Total Vulnerabilities: \(.metadata.vulnerabilities.total // 0)\n" +
    "  - Critical: \(.metadata.vulnerabilities.critical // 0)\n" +
    "  - High:     \(.metadata.vulnerabilities.high // 0)\n" +
    "  - Moderate: \(.metadata.vulnerabilities.moderate // 0)\n" +
    "  - Low:      \(.metadata.vulnerabilities.low // 0)"
  else
    "No vulnerabilities found ✓"
  end
' || echo "Failed to parse audit results"

# Outdated Dependencies
echo ""
echo -e "${YELLOW}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
echo -e "${YELLOW}┃  OUTDATED DEPENDENCIES                                   ┃${NC}"
echo -e "${YELLOW}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"
pnpm outdated 2>&1 | head -n 30 || echo "All dependencies up to date ✓"

# Key Package Versions
echo ""
echo -e "${BLUE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
echo -e "${BLUE}┃  CURRENT VERSIONS (Key Packages)                         ┃${NC}"
echo -e "${BLUE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"

get_version() {
  local package=$1
  local location=${2:-"."}

  if [ -f "${location}/package.json" ]; then
    jq -r "
      (.dependencies[\"${package}\"] // .devDependencies[\"${package}\"] // \"not installed\")
      | if . then sub(\"^[~^]\"; \"\") else \"not installed\" end
    " "${location}/package.json"
  else
    echo "N/A"
  fi
}

echo ""
echo "Security-Critical Packages:"
echo "  Next.js:     $(get_version 'next' 'examples/nextjs-chatbot')"
echo "  Vite:        $(get_version 'vite' 'examples/chatbot-demo')"
echo "  esbuild:     (transitive via Vite)"
echo ""
echo "Testing Frameworks:"
echo "  Jest:        $(get_version 'jest' 'packages/oci-genai-provider')"
echo "  Vitest:      $(get_version 'vitest' 'examples/chatbot-demo')"
echo ""
echo "Core Dependencies:"
echo "  Zod:         $(get_version 'zod' 'packages/oci-genai-provider')"
echo "  OpenAI SDK:  $(get_version 'openai' 'packages/oci-openai-compatible')"
echo "  AI SDK:      $(get_version 'ai' '.')"
echo ""
echo "Developer Tools:"
echo "  ESLint:      $(get_version 'eslint' 'examples/nextjs-chatbot')"
echo "  TypeScript:  $(get_version 'typescript' '.')"

# Upgrade Progress
echo ""
echo -e "${GREEN}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
echo -e "${GREEN}┃  UPGRADE PROGRESS                                        ┃${NC}"
echo -e "${GREEN}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"

if [ -f "UPGRADE_PLAN.md" ]; then
  echo ""
  echo "Phase 1 - Security Fixes:"
  check_version() {
    local pkg=$1
    local target=$2
    local location=$3
    local current=$(get_version "$pkg" "$location")

    if [[ "$current" == "$target"* ]] || [[ "$current" == *"$target"* ]]; then
      echo -e "  ✓ ${pkg}: ${current}"
    else
      echo -e "  ✗ ${pkg}: ${current} (target: ${target})"
    fi
  }

  check_version "next" "15.6" "examples/nextjs-chatbot"
  check_version "vite" "7" "examples/chatbot-demo"

  echo ""
  echo "Phase 2 - Testing Frameworks:"
  check_version "jest" "30" "packages/oci-genai-provider"
  check_version "vitest" "4" "examples/chatbot-demo"

  echo ""
  echo "Phase 3 - Developer Tools:"
  check_version "eslint" "9" "examples/nextjs-chatbot"

  echo ""
  echo "Phase 4 - Core Dependencies:"
  check_version "zod" "4" "packages/oci-genai-provider"
  check_version "openai" "6" "packages/oci-openai-compatible"
else
  echo "  ⚠ UPGRADE_PLAN.md not found"
  echo "  Run this command to create it:"
  echo "  $ cat > UPGRADE_PLAN.md << 'EOF'"
  echo "  ... (see upgrade plan) ..."
  echo "  EOF"
fi

# Test Status
echo ""
echo -e "${BLUE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${NC}"
echo -e "${BLUE}┃  TEST STATUS                                             ┃${NC}"
echo -e "${BLUE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${NC}"

echo ""
echo "Running quick test check..."
if pnpm test 2>&1 | tail -n 10; then
  echo -e "${GREEN}✓ Tests passing${NC}"
else
  echo -e "${RED}✗ Tests failing (see above)${NC}"
fi

# Recommendations
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RECOMMENDATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for security vulnerabilities
vuln_count=$(pnpm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0')
if [ "$vuln_count" -gt 0 ]; then
  echo -e "${RED}⚠  SECURITY VULNERABILITIES DETECTED${NC}"
  echo "   Run: ./scripts/upgrade-phase1-security.sh"
  echo ""
fi

# Check for major outdated packages
echo "Next Steps:"
echo "  1. Review: cat UPGRADE_PLAN.md"
echo "  2. Start Phase 1: ./scripts/upgrade-phase1-security.sh"
echo "  3. Check compatibility: cat .claude/dependency-compatibility-matrix.md"
echo ""
echo "For detailed analysis:"
echo "  $ pnpm outdated --recursive"
echo "  $ pnpm audit"
echo ""
