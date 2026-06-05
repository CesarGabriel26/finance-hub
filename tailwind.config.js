/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // Ativa o modo escuro ao adicionar a classe 'dark' na tag html
    theme: {
        extend: {
            colors: {
                // Escala semântica baseada nas suas paletas
                brand: {
                    1: '#f0f7ff',
                    2: '#cce0ff',
                    3: '#a6ccff',
                    4: '#66a3ff',
                    5: '#007acc',
                    6: '#00509e',
                    7: '#003366',
                    8: '#002244',
                    9: '#001122',
                },
                gamify: {
                    light: '#fff2e6',
                    base: '#ffcc00',
                    hover: '#ffdb4d',
                },
                success: {
                    DEFAULT: 'var(--success)',
                    light: '#e0f7f1',
                    base: '#007a33',
                    border: '#66b3a1',
                },
                danger: {
                    DEFAULT: 'var(--danger)',
                    light: '#ffcccc',
                    base: '#cc3333',
                    border: '#ff6666',
                },
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                    hover: 'var(--primary-hover)', // <-- Adicionado com segurança para bater com o CSS
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                    hover: 'var(--secondary-hover)', // <-- Adicionado com segurança para bater com o CSS
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                destructive: 'var(--destructive)',
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                sidebar: {
                    DEFAULT: 'var(--sidebar)',
                    foreground: 'var(--sidebar-foreground)',
                    primary: {
                        DEFAULT: 'var(--sidebar-primary)',
                        foreground: 'var(--sidebar-primary-foreground)',
                    },
                    accent: {
                        DEFAULT: 'var(--sidebar-accent)',
                        foreground: 'var(--sidebar-accent-foreground)',
                    },
                    border: 'var(--sidebar-border)',
                    ring: 'var(--sidebar-ring)',
                },
                chart: {
                    1: 'var(--chart-1)',
                    2: 'var(--chart-2)',
                    3: 'var(--chart-3)',
                    4: 'var(--chart-4)',
                    5: 'var(--chart-5)',
                }
            }
        },
    },
    plugins: [],
}