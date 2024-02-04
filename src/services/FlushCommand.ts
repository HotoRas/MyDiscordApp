import { Client, Routes, Snowflake } from "discord.js"

export const removeApplicationGuildCommands = async (client: Client, clientId: Snowflake, guildId: Snowflake): Promise<void> => {
    await client.rest.put(
        Routes.applicationGuildCommands(clientId, guildId), { body: [] }
    )
        .then(() => console.log(`Deleted all commands from guild ${guildId}`))
        .catch(console.error)
}

export const removeApplicationCommandsFromAllGuilds = async (client: Client, clientId: Snowflake, guildIds: Snowflake[]): Promise<void> => {
    guildIds.map(async guildId =>
        await removeApplicationGuildCommands(client, clientId, guildId)
    )
}

export const removeApplicationGlobalCommands = async (client: Client, clientId: Snowflake): Promise<void> => {
    await client.rest.put(
        Routes.applicationCommands(clientId), { body: [] }
    )
        .then(() => console.log('Deleted all global commands'))
        .catch(console.error)
}
