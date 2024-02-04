import { config } from './config'
import { CustomizedCommandClient } from './structures'
import { ActivityType, ApplicationCommand, Client, GatewayIntentBits, Routes } from 'discord.js'

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
  /*
  config.guilds.map(async gid => {
    await client.rest.put(
      Routes.applicationGuildCommands('1060523437661106316', gid), { body: [] }
    )
      .then(() => console.log(`Deleted all commands from guild ${gid}`))
      .catch(console.error)
  })
  //*/
}

start().then()
