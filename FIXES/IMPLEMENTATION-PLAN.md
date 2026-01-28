# OCI GenAI Provider - TDD Implementation Plan

## Goal: Achieve A++ Grade (95%+ Coverage, All Tests Passing, Type-Safe)

---

## Current Status

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Overall Coverage** | 83.49% | 95%+ | +11.5% |
| **Branch Coverage** | 67.53% | 85%+ | +17.47% |
| **Type Errors** | 1 CRITICAL | 0 | -1 |
| **Test Suites** | 30 passing, 1 failing | 31 passing | -1 |
| **Tests** | 286 passing | 350+ passing | -64+ |

---

## TDD Approach

### Phase 1: Write Tests (RED)
Write all missing tests according to specifications. Tests will FAIL initially.

### Phase 2: Fix Implementation (GREEN)
Update implementation to make tests pass.

### Phase 3: Audit & Refactor (REFACTOR)
- Run coverage report
- Identify remaining gaps
- Refactor for quality
- Repeat until A++

---

## Implementation Order

### 🔴 CRITICAL - Fix First

#### 1. Transcription Model Type Compatibility
**Status**: 🔴 Blocking compilation

**TDD Steps:**
```bash
# 1. Write tests (will fail to compile)
# 2. Fix TranscriptionOutput interface
# 3. Replace placeholder client
# 4. Implement doTranscribe correctly
# 5. Run tests - should pass
# 6. Check coverage - should be 90%+
```

**Files**:
- `src/transcription-models/OCITranscriptionModel.ts` - Fix implementation
- `src/transcription-models/__tests__/OCITranscriptionModel.test.ts` - Add tests

**Expected Coverage**: 32.65% → 90%+

---

#### 2. Embedding Model Core Functionality
**Status**: 🟡 Tests missing

**TDD Steps:**
```bash
# 1. Write client initialization tests (will fail)
# 2. Write doEmbed success tests (will fail)
# 3. Verify mocks are correct
# 4. Run tests - should pass (implementation is good)
# 5. Check coverage - should be 95%+
```

**Files**:
- `src/embedding-models/__tests__/oci-embedding-model.test.ts` - Add 15+ tests

**Expected Coverage**: 51.72% → 95%+

---

#### 3. Reranking Model Core Functionality
**Status**: 🟡 Tests missing

**TDD Steps:**
```bash
# 1. Write client initialization tests (will fail)
# 2. Write doRerank success tests (will fail)
# 3. Write document type validation tests (will fail)
# 4. Verify mocks are correct
# 5. Run tests - should pass (implementation is good)
# 6. Check coverage - should be 95%+
```

**Files**:
- `src/reranking-models/__tests__/OCIRerankingModel.test.ts` - Add 18+ tests

**Expected Coverage**: 51.61% → 95%+

---

### 🟡 HIGH PRIORITY - Do Next

#### 4. Speech Model Voice Fallback
**Status**: 🟢 Minor gap

**TDD Steps:**
```bash
# 1. Write voice fallback test (will fail if branch not covered)
# 2. Verify implementation handles all 3 cases
# 3. Run test - should pass
# 4. Check coverage - should be 98%+
```

**Files**:
- `src/speech-models/__tests__/OCISpeechModel.test.ts` - Add 3 tests

**Expected Coverage**: 88.88% → 98%+

---

#### 5. SSE Parser Edge Cases
**Status**: 🟢 Minor gaps

**TDD Steps:**
```bash
# 1. Write empty data test
# 2. Write error event test
# 3. Write malformed data test
# 4. Run tests - should pass or reveal bugs
# 5. Check coverage - should be 98%+
```

**Files**:
- `src/shared/streaming/__tests__/sse-parser.test.ts` - Add 6 tests

**Expected Coverage**: 91.17% stmt, 63.63% branch → 98% stmt, 90% branch

---

#### 6. Provider Integration Tests
**Status**: 🔴 Blocked by transcription fix

**TDD Steps:**
```bash
# 1. Fix transcription first (enables provider.test.ts)
# 2. Write config merging tests
# 3. Write all model types creation test
# 4. Run tests - should pass
# 5. Check coverage - provider.ts should be 100%
```

**Files**:
- `src/__tests__/provider.test.ts` - Fix + add 5 tests

**Expected**: Unblock provider.test.ts suite

---

### 🟢 NICE TO HAVE - Polish

#### 7. Language Model Converter Branch
**Status**: 🟢 Small gap

**TDD Steps:**
```bash
# 1. Write image content type test
# 2. Write file content type test
# 3. Run tests - check if OCI supports these
# 4. Coverage should be 100%
```

**Files**:
- `src/language-models/converters/__tests__/messages.test.ts` - Add 3 tests

**Expected Coverage**: 80% branch → 100% branch

---

#### 8. E2E Workflow Tests
**Status**: 🆕 New test suite

**TDD Steps:**
```bash
# 1. Write RAG pipeline test
# 2. Write multimodal pipeline test
# 3. Write error handling test
# 4. Run tests - integration verification
# 5. High-level coverage validation
```

**Files**:
- `src/__tests__/e2e-workflows.test.ts` - NEW file, 10+ tests

**Expected**: Integration validation

---

## Execution Plan

### Day 1: Critical Fixes (6-8 hours)

**Morning (3-4 hours):**
1. ✅ Fix TranscriptionModel type compatibility
2. ✅ Write 20+ transcription tests
3. ✅ Verify 90%+ coverage

**Afternoon (3-4 hours):**
4. ✅ Write 15+ embedding tests
5. ✅ Write 18+ reranking tests
6. ✅ Verify 95%+ coverage for both

**Evening:**
- Run full test suite
- Coverage: 83.49% → 92%+
- Type errors: 1 → 0
- Tests: 286 → 350+

---

### Day 2: Polish & Perfect (3-4 hours)

**Morning (2 hours):**
1. ✅ Add speech voice fallback tests
2. ✅ Add SSE parser edge case tests
3. ✅ Fix provider integration tests
4. ✅ Add converter branch tests

**Afternoon (1-2 hours):**
5. ✅ Write E2E workflow tests
6. ✅ Run full audit
7. ✅ Fix any remaining gaps

**Final Check:**
- Coverage: 92%+ → 95%+
- Branch coverage: 67.53% → 85%+
- All tests: PASSING
- Type errors: 0
- Grade: **A++**

---

## Success Criteria (A++ Grade)

### Code Quality
- ✅ No TypeScript errors
- ✅ All tests passing (350+ tests)
- ✅ No console warnings
- ✅ ESLint: 0 errors, 0 warnings

### Coverage
- ✅ Statement coverage: 95%+
- ✅ Branch coverage: 85%+
- ✅ Function coverage: 95%+
- ✅ Line coverage: 95%+

### Module-Specific
- ✅ Language Models: 99%+
- ✅ Embedding Models: 95%+
- ✅ Reranking Models: 95%+
- ✅ Transcription Models: 90%+
- ✅ Speech Models: 98%+
- ✅ SSE Parser: 98%+
- ✅ Auth: 100%
- ✅ Errors: 100%
- ✅ Utils: 99%+

### AI SDK Compliance
- ✅ All models implement correct V3 interfaces
- ✅ All required properties present
- ✅ Optional properties handled correctly
- ✅ Proper error types used
- ✅ Warnings system implemented

### Security
- ✅ No hardcoded secrets
- ✅ No dangerous code patterns
- ✅ Input validation on all user inputs
- ✅ Proper auth handling
- ✅ Secure error messages (no leaks)

### Documentation
- ✅ All public methods documented
- ✅ Type annotations complete
- ✅ Examples for each model type
- ✅ Migration guide updated
- ✅ Regional limitations documented

---

## Testing Commands

```bash
# Start TDD cycle
pnpm test:watch

# Run specific module
pnpm test transcription-models

# Check coverage after each fix
pnpm test:coverage

# Verify types
pnpm type-check

# Full validation
pnpm test:coverage && pnpm type-check && pnpm lint

# CI simulation
pnpm test:coverage:ci
```

---

## Expected Final Results

### Before
```
Test Suites: 1 failed, 30 passed, 31 total
Tests:       286 passed, 286 total
Coverage:    83.49% stmt | 67.53% branch | 86.2% func | 83.58% lines
TypeScript:  1 error
Grade:       B
```

### After
```
Test Suites: 31 passed, 31 total
Tests:       350+ passed, 350+ total
Coverage:    95%+ stmt | 85%+ branch | 95%+ func | 95%+ lines
TypeScript:  0 errors
Grade:       A++
```

---

## Next Steps

1. **Run**: `pnpm test:watch`
2. **Start**: With FIX #1 (Transcription)
3. **Follow**: TDD cycle (RED → GREEN → REFACTOR)
4. **Verify**: After each fix
5. **Iterate**: Until A++

Let's begin! 🚀
