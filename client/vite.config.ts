import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        // need to make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:4242',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'vendor',
                            test: /[\\/]node_modules[\\/].*(react|react-dom)[\\/]/,
                        },
                        {
                            name: 'router',
                            test: /[\\/]node_modules[\\/].*@tanstack[\\/]/,
                        },
                        {
                            name: 'ui',
                            test: /[\\/]node_modules[\\/].*(@base-ui|lucide-react|sonner)[\\/]/,
                        },
                    ],
                },
            },
        },
    },
});
