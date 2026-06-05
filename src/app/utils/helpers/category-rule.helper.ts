export function autoCategorize(description: string): string {
    const d = description.toLowerCase();
    if (/uber|99taxis|cabify|posto|combustivel|pedagio|gasolina/.test(d)) return 'Transporte';
    if (/ifood|restaurante|mcdonald|cafe|starbucks|padaria|supermercado|carrefour|bistr|alimento|\bbar\b/.test(d)) return 'Alimentação';
    if (/aluguel|condominio|\bluz\b|energia|copasa|cemig|sabesp|internet|claro|vivo|\btim\b|\bgas\b/.test(d)) return 'Moradia';
    if (/salario|salário|recebido|rendimento|provento/.test(d)) return 'Receitas';
    if (/netflix|spotify|steam|cinema|hbo|disney|ingresso|\bjogo\b|lazer|shopping|livraria/.test(d)) return 'Lazer';
    if (/farmacia|drogaria|hospital|medico|consulta|exame|saude|dentista/.test(d)) return 'Saúde';
    return 'Outros';
}

export function capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}