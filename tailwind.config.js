/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gray: {
                    800: '#2D3748', // Dark gray for background
                    600: '#4A5568', // Lighter gray for accents
                },
                teal: {
                    600: '#319795', // Main teal for buttons
                    700: '#2C7A7B', // Hover teal
                },
            },
        },
    },
    plugins: [],
}