import { Snowflake } from 'discord.js'
export interface LearnableCommand {
    command: string,
    answer: string,
    editable: boolean,
    learnfrom: Snowflake
}