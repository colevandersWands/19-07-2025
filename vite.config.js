import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { BASE_PATH } from './src/CONSTANTS';

export default defineConfig({
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        {
          src: 'content-assets', // relative to the project root
          dest: '', // copies into the root of `dist`
        },
      ],
    }),
  ],

  // Base path configuration for deployment
  base: process.env.NODE_ENV === 'production' ? BASE_PATH : '/',

  // CSS Modules configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['preact'],
          codemirror: [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-javascript',
            '@codemirror/theme-one-dark',
            'codemirror',
          ],
          parser: ['shift-parser', 'shift-scope'],
          prettier: ['prettier'],
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split('/')
                .pop()
                .replace(/\.[^.]+$/, '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
      },
    },
  },
});
