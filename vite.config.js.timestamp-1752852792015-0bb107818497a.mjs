// vite.config.js
import { defineConfig } from "file:///Users/master/Documents/0-teach-code/0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/spiral-lens/node_modules/vite/dist/node/index.js";
import preact from "file:///Users/master/Documents/0-teach-code/0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/spiral-lens/node_modules/@preact/preset-vite/dist/esm/index.mjs";
import { viteStaticCopy } from "file:///Users/master/Documents/0-teach-code/0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/spiral-lens/node_modules/vite-plugin-static-copy/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        {
          src: "content-assets",
          // relative to the project root
          dest: ""
          // copies into the root of `dist`
        }
      ]
    })
  ],
  // Base path configuration for deployment
  base: process.env.NODE_ENV === "production" ? "/19-07-2025/" : "/",
  // CSS Modules configuration
  css: {
    modules: {
      localsConvention: "camelCase",
      generateScopedName: "[name]__[local]___[hash:base64:5]"
    },
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  // Development server configuration
  server: {
    port: 3e3,
    open: true,
    host: true
  },
  // Build configuration
  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 1e3,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["preact"],
          codemirror: [
            "@codemirror/state",
            "@codemirror/view",
            "@codemirror/lang-javascript",
            "@codemirror/theme-one-dark",
            "codemirror"
          ],
          parser: ["shift-parser", "shift-scope"],
          prettier: ["prettier"]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop().replace(/\.[^.]+$/, "") : "chunk";
          return `assets/${facadeModuleId}-[hash].js`;
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWFzdGVyL0RvY3VtZW50cy8wLXRlYWNoLWNvZGUvMC0tLXRoZS1iaWctaWRlYS8wMC0tZXZhbmNvbGUtYmUvMC0tc25pcHBldHJ5L2R1bXAvMDAtY2xhdWRlLXJlZmFjdG9yaW5nL3NwaXJhbC1sZW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbWFzdGVyL0RvY3VtZW50cy8wLXRlYWNoLWNvZGUvMC0tLXRoZS1iaWctaWRlYS8wMC0tZXZhbmNvbGUtYmUvMC0tc25pcHBldHJ5L2R1bXAvMDAtY2xhdWRlLXJlZmFjdG9yaW5nL3NwaXJhbC1sZW5zL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9tYXN0ZXIvRG9jdW1lbnRzLzAtdGVhY2gtY29kZS8wLS0tdGhlLWJpZy1pZGVhLzAwLS1ldmFuY29sZS1iZS8wLS1zbmlwcGV0cnkvZHVtcC8wMC1jbGF1ZGUtcmVmYWN0b3Jpbmcvc3BpcmFsLWxlbnMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBwcmVhY3QgZnJvbSAnQHByZWFjdC9wcmVzZXQtdml0ZSc7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHByZWFjdCgpLFxuICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogJ2NvbnRlbnQtYXNzZXRzJywgLy8gcmVsYXRpdmUgdG8gdGhlIHByb2plY3Qgcm9vdFxuICAgICAgICAgIGRlc3Q6ICcnLCAvLyBjb3BpZXMgaW50byB0aGUgcm9vdCBvZiBgZGlzdGBcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG5cbiAgLy8gQmFzZSBwYXRoIGNvbmZpZ3VyYXRpb24gZm9yIGRlcGxveW1lbnRcbiAgYmFzZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyA/ICcvMTktMDctMjAyNS8nIDogJy8nLFxuXG4gIC8vIENTUyBNb2R1bGVzIGNvbmZpZ3VyYXRpb25cbiAgY3NzOiB7XG4gICAgbW9kdWxlczoge1xuICAgICAgbG9jYWxzQ29udmVudGlvbjogJ2NhbWVsQ2FzZScsXG4gICAgICBnZW5lcmF0ZVNjb3BlZE5hbWU6ICdbbmFtZV1fX1tsb2NhbF1fX19baGFzaDpiYXNlNjQ6NV0nLFxuICAgIH0sXG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgY3NzOiB7XG4gICAgICAgIGNoYXJzZXQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuXG4gIC8vIERldmVsb3BtZW50IHNlcnZlciBjb25maWd1cmF0aW9uXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBob3N0OiB0cnVlLFxuICB9LFxuXG4gIC8vIEJ1aWxkIGNvbmZpZ3VyYXRpb25cbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3ByZWFjdCddLFxuICAgICAgICAgIGNvZGVtaXJyb3I6IFtcbiAgICAgICAgICAgICdAY29kZW1pcnJvci9zdGF0ZScsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvdmlldycsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvbGFuZy1qYXZhc2NyaXB0JyxcbiAgICAgICAgICAgICdAY29kZW1pcnJvci90aGVtZS1vbmUtZGFyaycsXG4gICAgICAgICAgICAnY29kZW1pcnJvcicsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBwYXJzZXI6IFsnc2hpZnQtcGFyc2VyJywgJ3NoaWZ0LXNjb3BlJ10sXG4gICAgICAgICAgcHJldHRpZXI6IFsncHJldHRpZXInXSxcbiAgICAgICAgfSxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IChjaHVua0luZm8pID0+IHtcbiAgICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZFxuICAgICAgICAgICAgPyBjaHVua0luZm8uZmFjYWRlTW9kdWxlSWRcbiAgICAgICAgICAgICAgICAuc3BsaXQoJy8nKVxuICAgICAgICAgICAgICAgIC5wb3AoKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXC5bXi5dKyQvLCAnJylcbiAgICAgICAgICAgIDogJ2NodW5rJztcbiAgICAgICAgICByZXR1cm4gYGFzc2V0cy8ke2ZhY2FkZU1vZHVsZUlkfS1baGFzaF0uanNgO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZoQixTQUFTLG9CQUFvQjtBQUMxakIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsc0JBQXNCO0FBRS9CLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLGVBQWU7QUFBQSxNQUNiLFNBQVM7QUFBQSxRQUNQO0FBQUEsVUFDRSxLQUFLO0FBQUE7QUFBQSxVQUNMLE1BQU07QUFBQTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUEsRUFHQSxNQUFNLFFBQVEsSUFBSSxhQUFhLGVBQWUsaUJBQWlCO0FBQUE7QUFBQSxFQUcvRCxLQUFLO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDUCxrQkFBa0I7QUFBQSxNQUNsQixvQkFBb0I7QUFBQSxJQUN0QjtBQUFBLElBQ0EscUJBQXFCO0FBQUEsTUFDbkIsS0FBSztBQUFBLFFBQ0gsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBO0FBQUEsRUFHQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCx1QkFBdUI7QUFBQSxJQUN2QixjQUFjO0FBQUEsSUFDZCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsUUFBUTtBQUFBLFVBQ2pCLFlBQVk7QUFBQSxZQUNWO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFFBQVEsQ0FBQyxnQkFBZ0IsYUFBYTtBQUFBLFVBQ3RDLFVBQVUsQ0FBQyxVQUFVO0FBQUEsUUFDdkI7QUFBQSxRQUNBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsZ0JBQU0saUJBQWlCLFVBQVUsaUJBQzdCLFVBQVUsZUFDUCxNQUFNLEdBQUcsRUFDVCxJQUFJLEVBQ0osUUFBUSxZQUFZLEVBQUUsSUFDekI7QUFDSixpQkFBTyxVQUFVLGNBQWM7QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
