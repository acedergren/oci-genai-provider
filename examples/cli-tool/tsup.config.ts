import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['cjs'],
  clean: true,
  bundle: true,
  noExternal: [
    '@acedergren/oci-genai-provider',
    'ai',
    'pino',
    'commander',
    'inquirer',
    'chalk',
    'eventsource-parser',
    'oci-common',
    'oci-generativeaiinference',
    'oci-aispeech',
    'oci-identity',
    'oci-objectstorage',
    'zod',
  ],
  minify: true,
  sourcemap: false,
  target: 'node20',
  shims: true,
});
