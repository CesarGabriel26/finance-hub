/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
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
                bg: 'var(--bg)',
                card: 'var(--card)',
                text: 'var(--text)',
                textMuted: 'var(--text-muted)'
            }
        }
    },
    plugins: []
}