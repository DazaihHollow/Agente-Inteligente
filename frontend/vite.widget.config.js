import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
    plugins: [
        react(),
        cssInjectedByJsPlugin(), // Injects CSS into the JS bundle
    ],
    build: {
        lib: {
            entry: 'src/widget.jsx',
            name: 'AgenteWidget',
            fileName: (format) => `widget.${format}.js`,
            formats: ['umd'], // UMD for browser compatibility (<script> tag)
        },
        outDir: 'dist-widget',
        rollupOptions: {
            // Ensure we bundle React and ReactDOM because the host site might not have them
            // If we wanted to exclude them, we'd list them here.
            // But for a drop-in widget, it's safer to bundle them (though file size is larger).
            external: [],
            output: {
                globals: {},
            },
        },
        emptyOutDir: true,
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
});
