import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        tailwindcss(),
    ],
    define: {
        // eslint-disable-next-line no-undef
        'process.env.SECRET_KEY': JSON.stringify(process.env.SECRET_KEY),
    },
    server: {
        port: 8080
    }
})
