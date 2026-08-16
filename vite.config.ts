import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        // Library consumers get the read-only patch renderer instead of Monaco.
        // Bundling Monaco here would add ~2.5MB to dist/index.js and dist/index.cjs,
        // and Vite would rewrite its worker + codicon.ttf references to
        // root-absolute /assets/... paths that only resolve when the consumer is
        // served from the web root. The Tauri app build (vite.tauri.config.ts)
        // has no alias and uses the real pane.
        //
        // Anchored regex, not a string: string aliases are prefix matches and
        // would also rewrite './MonacoDiffPane.stub'.
        find: /^\.\/MonacoDiffPane$/,
        replacement: resolve(__dirname, 'src/components/common/MonacoDiffPane.stub.tsx')
      }
    ]
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GitClientDesign',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'style.css';
          return '[name][extname]';
        }
      }
    },
    cssCodeSplit: false
  }
});
