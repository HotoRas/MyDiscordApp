import { config } from './config'
import { CustomizedCommandClient } from './structures'
import { Client, GatewayIntentBits } from 'discord.js'

const client = new Client({
  //intents: ['Guilds', 'DirectMessages', 'MessageContent'],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
})

const cts = new CustomizedCommandClient(client)

const start = async () => {
  await cts.setup()

  await client.login(config.token)

  await cts.getApplicationCommandsExtension()?.sync()
}

start().then()
