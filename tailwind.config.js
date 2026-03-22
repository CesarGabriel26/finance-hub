/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563EB',
                secondary: '#14B8A6',
                success: '#22C55E',
                danger: '#EF4444',
                warning: '#F59E0B',
                bg: '#F8FAFC',
                card: '#FFFFFF',
                text: '#0F172A',
                textMuted: '#64748B'
            }
        }
    },
    plugins: []
}