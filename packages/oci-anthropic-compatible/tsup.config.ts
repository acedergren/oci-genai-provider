import { defineConfig } from 'tsup';

export default defineConfig([
  // Main library build
  {
    entry: ['src/index.ts', 'src/server.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    external: ['ai', '@acedergren/oci-genai-provider'],
  },
  // CLI build (single executable)
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    sourcemap: false,
    splitting: false,
    external: ['ai', '@acedergren/oci-genai-provider'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
