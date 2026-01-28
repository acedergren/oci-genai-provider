// vitest.config.ts
import { defineConfig } from "file:///Users/acedergr/Projects/opencode-oci-genai/node_modules/.pnpm/vitest@2.1.9_@types+node@25.0.10_@vitest+ui@2.1.9_jsdom@24.1.3_lightningcss@1.30.2/node_modules/vitest/dist/config.js";
import { svelte } from "file:///Users/acedergr/Projects/opencode-oci-genai/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@5.1.1_svelte@5.48.5_vite@6.4.1_@types+node@25.0.10_jiti@2._d7808af9fe5ed1e923f687cbca2e639d/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import "file:///Users/acedergr/Projects/opencode-oci-genai/node_modules/.pnpm/tailwindcss@4.1.18/node_modules/tailwindcss/dist/lib.mjs";
var vitest_config_default = defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    include: ["src/**/*.test.{ts,svelte}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", ".svelte-kit/"]
    }
  },
  resolve: {
    alias: {
      $lib: "/src/lib",
      $app: "/src/.svelte-kit/runtime/app"
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9hY2VkZXJnci9Qcm9qZWN0cy9vcGVuY29kZS1vY2ktZ2VuYWkvZXhhbXBsZXMvY2hhdGJvdC1kZW1vXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYWNlZGVyZ3IvUHJvamVjdHMvb3BlbmNvZGUtb2NpLWdlbmFpL2V4YW1wbGVzL2NoYXRib3QtZGVtby92aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9hY2VkZXJnci9Qcm9qZWN0cy9vcGVuY29kZS1vY2ktZ2VuYWkvZXhhbXBsZXMvY2hhdGJvdC1kZW1vL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCB7IHN2ZWx0ZSB9IGZyb20gJ0BzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGUnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ3RhaWx3aW5kY3NzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3N2ZWx0ZSh7IGhvdDogIXByb2Nlc3MuZW52LlZJVEVTVCB9KV0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIHNldHVwRmlsZXM6IFtdLFxuICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoudGVzdC57dHMsc3ZlbHRlfSddLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXG4gICAgICBleGNsdWRlOiBbJ25vZGVfbW9kdWxlcy8nLCAnLnN2ZWx0ZS1raXQvJ10sXG4gICAgfSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAkbGliOiAnL3NyYy9saWInLFxuICAgICAgJGFwcDogJy9zcmMvLnN2ZWx0ZS1raXQvcnVudGltZS9hcHAnLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVgsU0FBUyxvQkFBb0I7QUFDdFosU0FBUyxjQUFjO0FBQ3ZCLE9BQXdCO0FBRXhCLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsQ0FBQztBQUFBLEVBQzlDLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVksQ0FBQztBQUFBLElBQ2IsU0FBUyxDQUFDLDJCQUEyQjtBQUFBLElBQ3JDLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVMsQ0FBQyxpQkFBaUIsY0FBYztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
