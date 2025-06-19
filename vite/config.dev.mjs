import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, '..')
        }
    },
    define: {
        // eslint-disable-next-line no-undef
        'process.env.SECRET_KEY': JSON.stringify(process.env.SECRET_KEY),
    },
    server: {
        port: 8080
    }
})
