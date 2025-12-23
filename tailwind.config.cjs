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
                // Brand Palette
                sky: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    400: '#94a3b8',
                    500: '#64748b',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a'
                }
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
                '4xl': "2.5rem",
                '5xl': "3rem",
            },
            boxShadow: {
                'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                'premium': '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
                'glow': '0 0 15px rgba(19, 91, 236, 0.5)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'scale-in': 'scaleIn 0.4s ease-out forwards',
                'bounce-soft': 'bounceSoft 2s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(-2px)' },
                    '50%': { transform: 'translateY(2px)' },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
