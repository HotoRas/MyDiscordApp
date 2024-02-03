export enum InvestEventChance {
    BROKE,
    MINUS,
    STATIC,
    GOOD,
    GREAT,
    WONDERFUL
}
export interface InvestEventResult {
    state: InvestEventChance,
    result: number,
    diff: number
}
export function InvestEvent(money: number): InvestEventResult {
    const chance: number = Math.random() * 100
    const value: number = Math.random()
    if (chance < 5 || money <= 10) return {
        state: InvestEventChance.BROKE,
        result: 0,
        diff: 0
    }
    if (chance < 25) return {
        state: InvestEventChance.MINUS,
        result: money - Math.floor((money * (value * 21 + 10)) / 100),
        diff: Math.floor(value * 21 + 10)
    }
    if (chance < 30) return {
        state: InvestEventChance.STATIC,
        result: money,
        diff: 0
    }
    if (chance < 50) return {
        state: InvestEventChance.GOOD,
        result: money + Math.floor((money * (value * 21 + 10)) / 100),
        diff: Math.floor(value * 21 + 10)
    }
    if (chance < 99.9) return {
        state: InvestEventChance.GREAT,
        result: money + Math.floor((money * (value * 101 + 100)) / 100),
        diff: Math.floor(value * 101 + 100)
    }
    return {
        state: InvestEventChance.WONDERFUL,
        result: money * 5,
        diff: 500
    }
}