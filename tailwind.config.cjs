/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#135bec",
                "primary-dark": "#164cdb",
                secondary: "#2563eb",
                "background-light": "#f6f7f8",
                "background-dark": "#0f172a",
                "surface-light": "#ffffff",
                "surface-dark": "#1e293b",
                "text-main": "#111827",
                "text-sub": "#6B7280",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                body: ["Inter", "sans-serif"],
                jakarta: ["'Plus Jakarta Sans'", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.75rem",
                'xl': "1rem",
                '2xl': "1.5rem",
                '3xl': "2rem",
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
