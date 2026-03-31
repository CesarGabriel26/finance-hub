export function getDaysRemainingInMonth(today: Date = new Date(), month: number = new Date().getMonth(), year: number = new Date().getFullYear()): number {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate();
    return daysRemaining;
}

export function getDayOfMonth(): number {
    const today = new Date();
    return today.getDate();
}

export function getDaysinMonth(year: number = new Date().getFullYear(), month: number = new Date().getMonth()) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return daysInMonth;
}