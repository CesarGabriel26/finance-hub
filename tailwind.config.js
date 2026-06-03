/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // Ativa o modo escuro ao adicionar a classe 'dark' na tag html
    theme: {
        extend: {
            colors: {
                // Escala semântica baseada nas suas paletas
                brand: {
                    1: '#f0f7ff',  // Fundo Ultra Claro
                    2: '#cce0ff',  // Azul Suave (Bordas/Cards no light)
                    3: '#a6ccff',
                    4: '#66a3ff',  // Azul Vibrante (Texto no dark)
                    5: '#007acc',  // Cor Principal / Ações Finanças
                    6: '#00509e',  // Hover / Destaques
                    7: '#003366',  // Fundo de Componente no Dark
                    8: '#002244',  // Fundo do Card no Dark
                    9: '#001122',  // Fundo Geral Dark Ultra Escuro
                },
                gamify: {
                    light: '#fff2e6',
                    base: '#ffcc00',  // Amarelo Duolingo (XP, Moedas, Streaks)
                    hover: '#ffdb4d',
                },
                success: {
                    light: '#e0f7f1',
                    base: '#007a33',  // Verde Lucro/Acerto
                    border: '#66b3a1',
                },
                danger: {
                    light: '#ffcccc',
                    base: '#cc3333',  // Vermelho Prejuízo/Atenção
                    border: '#ff6666',
                }
            },
        },
    },
    plugins: [],
}