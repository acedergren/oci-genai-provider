import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  optimizeDeps: {
    include: ['ai', '@ai-sdk/svelte'],
    exclude: ['@acedergren/oci-genai-provider'],
  },

  // Suppress punycode deprecation warning (from uri-js dependency)
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress punycode deprecation warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
});
