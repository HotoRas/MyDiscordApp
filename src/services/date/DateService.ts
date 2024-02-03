export function isSameDate(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getDay() === b.getDay() && a.getFullYear() === b.getFullYear()
}

export function getYesterday(): Date {
    const today: Date = new Date(Date.now())
    let yyyy: number = today.getFullYear()
    let mm: number = today.getMonth()
    let dd: number = today.getDate()
    dd -= 1
    if (dd === 0) {
        mm -= 1
        if (mm === 0) {
            yyyy -= 1
            mm = 12
        }
        if (mm === 4 || mm === 6 || mm === 9 || mm === 11) dd = 30
        else if (mm === 2) {
            if (yyyy % 4 === 0 && (yyyy % 100 !== 0 || yyyy % 400 === 0)) mm = 29
            else { mm = 28 }
        }
        else mm = 30
    }
    return new Date(yyyy, mm, dd)
}