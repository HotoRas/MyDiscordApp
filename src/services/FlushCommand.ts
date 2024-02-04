import { Client, Routes, Snowflake } from "discord.js"
import { Logger } from "tslog"
import chalk from 'chalk'

export const removeApplicationGuildCommands = async (client: Client, clientId: Snowflake, guildId: Snowflake): Promise<void> => {
    const logger: Logger<unknown> = new Logger<unknown>
    await client.rest.put(
        Routes.applicationGuildCommands(clientId, guildId), { body: [] }
    )
        .then(() => logger.info(`Deleted all commands from guild ${chalk.blue(guildId)}`))
        .catch(console.error)
}

export const removeApplicationCommandsFromAllGuilds = async (client: Client, clientId: Snowflake, guildIds: Snowflake[]): Promise<void> => {
    guildIds.map(async guildId =>
        await removeApplicationGuildCommands(client, clientId, guildId)
    )
}

export const removeApplicationGlobalCommands = async (client: Client, clientId: Snowflake): Promise<void> => {
    const logger: Logger<unknown> = new Logger<unknown>
    await client.rest.put(
        Routes.applicationCommands(clientId), { body: [] }
    )
        .then(() => logger.info('Deleted all global commands'))
        .catch(console.error)
}
