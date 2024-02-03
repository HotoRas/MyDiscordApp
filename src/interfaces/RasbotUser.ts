import { Snowflake } from 'discord.js'
export interface RasBotUser {
    id: Snowflake,
    name: string,
    balance: number,
    lastvisit: Date
}