export function isSameDate(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getDay() === b.getDay() && a.getFullYear() === b.getFullYear()
}

export function getYesterday(): Date {
    return new Date(Date.now() - 24 * 60 * 60)
}