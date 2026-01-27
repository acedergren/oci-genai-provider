#!/usr/bin/env node
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, streamText, type LanguageModelV1 } from 'ai';
import * as readline from 'node:readline';

// Configuration
const MODEL_ID = process.env.OCI_MODEL_ID || 'cohere.command-r-plus';
const COMPARTMENT_ID = process.env.OCI_COMPARTMENT_ID;
const REGION = process.env.OCI_REGION || 'eu-frankfurt-1';

if (!COMPARTMENT_ID) {
  console.error('Error: OCI_COMPARTMENT_ID environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...');
  console.error('  export OCI_REGION=eu-frankfurt-1  # optional');
  console.error('  export OCI_MODEL_ID=cohere.command-r-plus  # optional');
  console.error('');
  console.error('Then run:');
  console.error('  pnpm dev "Your prompt here"');
  console.error('  echo "Your prompt" | pnpm dev');
  process.exit(1);
}

// Create model
const model = oci(MODEL_ID, {
  compartmentId: COMPARTMENT_ID,
  region: REGION,
}) as unknown as LanguageModelV1;

// Check for piped input
async function readStdin(): Promise<string | null> {
  if (process.stdin.isTTY) {
    return null;
  }

  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks.join('').trim();
}

// Interactive REPL mode
async function startRepl(): Promise<void> {
  console.log('OCI GenAI CLI');
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Region: ${REGION}`);
  console.log('Type "exit" or press Ctrl+C to quit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        process.exit(0);
      }

      if (!input.trim()) {
        prompt();
        return;
      }

      process.stdout.write('AI: ');

      try {
        const result = streamText({
          model,
          prompt: input,
        });

        for await (const chunk of result.textStream) {
          process.stdout.write(chunk);
        }
        console.log('\n');
      } catch (error) {
        console.error('\nError:', error instanceof Error ? error.message : error);
        console.log('');
      }

      prompt();
    });
  };

  prompt();
}

// One-shot query
async function query(input: string, stream = true): Promise<void> {
  try {
    if (stream) {
      const result = streamText({
        model,
        prompt: input,
      });

      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
      }
      console.log('');
    } else {
      const result = await generateText({
        model,
        prompt: input,
      });
      console.log(result.text);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Main entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flags = {
    noStream: args.includes('--no-stream'),
    help: args.includes('--help') || args.includes('-h'),
  };
  const positionalArgs = args.filter((a) => !a.startsWith('--') && a !== '-h');

  if (flags.help) {
    console.log(`
OCI GenAI CLI - Chat with Oracle Cloud AI models

Usage:
  pnpm dev [options] [prompt]       One-shot query
  pnpm dev                          Interactive REPL mode
  echo "prompt" | pnpm dev          Pipe input

Options:
  --no-stream    Disable streaming (wait for complete response)
  --help, -h     Show this help message

Environment:
  OCI_COMPARTMENT_ID  Required. Your OCI compartment OCID
  OCI_REGION          Optional. OCI region (default: eu-frankfurt-1)
  OCI_MODEL_ID        Optional. Model ID (default: cohere.command-r-plus)

Examples:
  pnpm dev "What is TypeScript?"
  pnpm dev --no-stream "Explain async/await"
  echo "Hello" | pnpm dev
`);
    process.exit(0);
  }

  // Check for piped input
  const pipedInput = await readStdin();

  if (pipedInput) {
    // Piped input mode
    await query(pipedInput, !flags.noStream);
  } else if (positionalArgs.length > 0) {
    // One-shot query mode
    await query(positionalArgs.join(' '), !flags.noStream);
  } else {
    // Interactive REPL mode
    await startRepl();
  }
}

main();
