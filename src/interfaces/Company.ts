import { Snowflake } from 'discord.js'

export type RasbotCompany = {
    name: string
    owner: Snowflake
    guild: Snowflake | ''
    money: number
}