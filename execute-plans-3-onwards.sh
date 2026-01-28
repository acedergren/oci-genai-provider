#!/bin/bash
# execute-plans-3-onwards.sh
# Automated execution of Plans 3-7 (Speech, Transcription, Reranking, Docs, Testing)
# Prerequisites: Plans 1 and 2 must be complete

set -e  # Exit on any error

CLAUDE_CMD="claude --model haiku --print --dangerously-skip-permissions"

echo "════════════════════════════════════════════════════════════════"
echo "  OCI AI SDK Provider - Plans 3-7 Automated Execution"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Prerequisites: Plans 1 (Core) and 2 (Embeddings) must be complete"
echo ""

# Verify Plans 1-2 are complete
if [ ! -d "packages/oci-genai-provider/src/language-models" ] || [ ! -d "packages/oci-genai-provider/src/embedding-models" ]; then
  echo "❌ Error: Plans 1-2 not complete. Missing language-models or embedding-models directories."
  echo "   Please execute Plans 1 and 2 first."
  exit 1
fi

echo "✅ Prerequisites verified"
echo ""

# Plans 3-5: Parallel execution (independent model types)
echo "🔄 Starting Plans 3-5 in parallel..."
echo "   • Plan 3: Speech Models (TTS)"
echo "   • Plan 4: Transcription Models (STT)"
echo "   • Plan 5: Reranking Models"
echo ""

# Launch Plans 3-5 in parallel
$CLAUDE_CMD "/superpowers:executing-plans docs/plans/2026-01-28-plan-03-speech-tts.md" > plan3-output.log 2>&1 &
PID3=$!
echo "   [PID $PID3] Plan 3 started → plan3-output.log"

$CLAUDE_CMD "/superpowers:executing-plans docs/plans/2026-01-28-plan-04-transcription-stt.md" > plan4-output.log 2>&1 &
PID4=$!
echo "   [PID $PID4] Plan 4 started → plan4-output.log"

$CLAUDE_CMD "/superpowers:executing-plans docs/plans/2026-01-28-plan-05-reranking.md" > plan5-output.log 2>&1 &
PID5=$!
echo "   [PID $PID5] Plan 5 started → plan5-output.log"

echo ""
echo "⏳ Waiting for Plans 3-5 to complete..."
echo ""

# Wait for each plan with status updates
wait $PID3
if [ $? -eq 0 ]; then
  echo "✅ Plan 3 (Speech TTS) Complete"
else
  echo "❌ Plan 3 (Speech TTS) Failed - check plan3-output.log"
  exit 1
fi

wait $PID4
if [ $? -eq 0 ]; then
  echo "✅ Plan 4 (Transcription STT) Complete"
else
  echo "❌ Plan 4 (Transcription STT) Failed - check plan4-output.log"
  exit 1
fi

wait $PID5
if [ $? -eq 0 ]; then
  echo "✅ Plan 5 (Reranking) Complete"
else
  echo "❌ Plan 5 (Reranking) Failed - check plan5-output.log"
  exit 1
fi

echo ""
echo "🎉 All model implementations complete!"
echo ""

# Plan 6: Documentation
echo "📝 Plan 6: Documentation & Examples"
echo ""
$CLAUDE_CMD "/superpowers:executing-plans docs/plans/2026-01-28-plan-06-documentation.md" | tee plan6-output.log

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Plan 6 (Documentation) Complete"
  echo ""
else
  echo ""
  echo "❌ Plan 6 (Documentation) Failed - check plan6-output.log"
  exit 1
fi

# Plan 7: Testing Infrastructure
echo "🧪 Plan 7: Testing Infrastructure & Coverage"
echo ""
$CLAUDE_CMD "/superpowers:executing-plans docs/plans/2026-01-28-plan-07-testing.md" | tee plan7-output.log

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Plan 7 (Testing) Complete"
  echo ""
else
  echo ""
  echo "❌ Plan 7 (Testing) Failed - check plan7-output.log"
  exit 1
fi

# Verify implementation completion
echo ""
echo "🔍 Verifying implementation..."
echo ""

VERIFICATION_FAILED=0

# Check Plan 3 (Speech)
if [ -d "packages/oci-genai-provider/src/speech-models" ]; then
  echo "✅ Plan 3: Speech Models (TTS) - Directory created"
else
  echo "⚠️  Plan 3: Speech Models (TTS) - Directory missing"
  VERIFICATION_FAILED=1
fi

# Check Plan 4 (Transcription)
if [ -d "packages/oci-genai-provider/src/transcription-models" ]; then
  echo "✅ Plan 4: Transcription Models (STT) - Directory created"
else
  echo "⚠️  Plan 4: Transcription Models (STT) - Directory missing"
  VERIFICATION_FAILED=1
fi

# Check Plan 5 (Reranking)
if [ -d "packages/oci-genai-provider/src/reranking-models" ]; then
  echo "✅ Plan 5: Reranking Models - Directory created"
else
  echo "⚠️  Plan 5: Reranking Models - Directory missing"
  VERIFICATION_FAILED=1
fi

echo ""

# Final summary
if [ $VERIFICATION_FAILED -eq 0 ]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "  🎉 Success! All Plans 3-7 Executed"
  echo "════════════════════════════════════════════════════════════════"
else
  echo "════════════════════════════════════════════════════════════════"
  echo "  ⚠️  Plans Executed with Warnings"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "Some model directories were not created. Check the output logs."
fi
echo ""
echo "📋 Completed Plans:"
echo "   • Plan 3: Speech Models (TTS)"
echo "   • Plan 4: Transcription Models (STT)"
echo "   • Plan 5: Reranking Models"
echo "   • Plan 6: Documentation & Examples"
echo "   • Plan 7: Testing Infrastructure"
echo ""
echo "📊 Output logs:"
echo "   • plan3-output.log - Speech TTS execution"
echo "   • plan4-output.log - Transcription STT execution"
echo "   • plan5-output.log - Reranking execution"
echo "   • plan6-output.log - Documentation execution"
echo "   • plan7-output.log - Testing execution"
echo ""
echo "🔍 Next steps:"
echo "   1. Review output logs for any issues"
echo "   2. Run: pnpm test (verify 80%+ coverage)"
echo "   3. Run: pnpm build (verify all packages build)"
echo "   4. Test all demos (chatbot, cli, rag)"
echo ""
echo "🚀 Provider implementation complete!"
echo ""
