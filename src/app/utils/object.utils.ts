export function DeepSearch(obj: any, key: string): any {
    // Verifica se o objeto atual é válido e se a chave existe nele
    if (obj && typeof obj === 'object') {
        if (key in obj) {
            return obj[key];
        }

        // Se não encontrou, percorre os valores para buscar nos filhos
        for (const value of Object.values(obj)) {
            const result = DeepSearch(value, key);
            if (result !== undefined) {
                return result;
            }
        }
    }
    return undefined;
};