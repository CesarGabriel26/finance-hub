export function getDaysRemainingInMonth(): number {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate();
    return daysRemaining;
}

export function getDayOfMonth(): number {
    const today = new Date();
    return today.getDate();
}