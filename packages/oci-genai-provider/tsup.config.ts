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
  outDir: 'dist',
});
