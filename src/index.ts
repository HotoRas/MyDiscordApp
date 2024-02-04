import { config } from './config'
import { CustomizedCommandClient } from './structures'
import { ActivityType, ApplicationCommand, Client } from 'discord.js'

const client = new Client({
  intents: ['Guilds', 'DirectMessages', 'GuildMessages', 'MessageContent'],
  presence: {
    afk: false,
    status: 'online',
    activities: [
      {
        name: "'라즈야'로 불러보세요!",
        type: ActivityType.Playing
      }
    ]
  }
})

const cts = new CustomizedCommandClient(client)

const start = async () => {
  await cts.setup()

  await client.login(config.token)

  await cts.getApplicationCommandsExtension()?.sync()
}

start().then()
