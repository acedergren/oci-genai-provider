import { defineConfig } from 'tsup';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  external: [
    '@acedergren/oci-genai-provider',
    'oci-common',
    'oci-generativeaiinference',
    'stream',
    'buffer',
    'crypto',
    'events',
    'os',
    'path',
    'util',
    'zlib',
    'url',
    'http',
    'https',
    'tls',
    'net',
  ],
  outDir: 'dist',
});
