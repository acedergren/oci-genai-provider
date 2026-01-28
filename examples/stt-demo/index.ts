import { oci } from "@acedergren/oci-genai-provider";
import { transcribe } from "ai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("🎙️  OCI Speech-to-Text Demo
");

  const audioPath = process.argv[2] || join(__dirname, "sample-audio.wav");

  console.log(`📁 Loading audio: ${audioPath}`);

  let audioData: Uint8Array;
  try {
    audioData = readFileSync(audioPath);
  } catch (error) {
    console.error("❌ Error loading audio file:", error);
    console.log("
Usage: pnpm start [path-to-audio-file.wav]");
    process.exit(1);
  }

  console.log(`   Size: ${(audioData.byteLength / 1024).toFixed(1)} KB
`);

  console.log("🔹 Using model: oci.speech.standard");
  console.log("🌍 Language: en-US
");

  const transcriptionModel = oci.transcriptionModel("oci.speech.standard", {
    language: "en-US",
    vocabulary: ["OpenCode", "GenAI", "OCI", "Oracle"],
  });

  console.log("⏳ Transcribing audio...");
  console.log("   (This may take 30-60 seconds)
");

  const startTime = Date.now();

  const { text, language } = await transcribe({
    model: transcriptionModel,
    audioData,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("✅ Transcription complete\!
");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 TRANSCRIPT:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
");
  console.log(text);
  console.log("
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`
📊 Language: ${language}`);
  console.log(`⏱️  Duration: ${duration}s`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
