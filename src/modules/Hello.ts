import fs from 'fs'
import { config } from '../config'
import { Extension, applicationCommand, listener } from '@pikokr/command.ts'
import { ApplicationCommandType, ChatInputCommandInteraction, Message } from 'discord.js'

interface HeyRas {
  command: commands[]
}
interface commands {
  question: string
  answer: string
}

const jsonFile = fs.readFileSync('./HeyRas.json', 'utf8')
const jsonData: HeyRas = JSON.parse(jsonFile)
const command = jsonData.command

class HelloExtension extends Extension {
  @listener({ event: 'ready' })
  async ready() {
    this.logger.info(`Logged in as ${this.client.user?.tag}`)
    await this.commandClient.fetchOwners()
  }

  @listener({ event: 'applicationCommandInvokeError', emitter: 'cts' })
  async errorHandler(err: Error) {
    this.logger.error(err)
  }

  @applicationCommand({
    name: 'ping',
    type: ApplicationCommandType.ChatInput,
    description: 'wow this is ping',
  })
  async ping(i: ChatInputCommandInteraction) {
    await i.reply(`current ping: ${i.client.ws.ping}ms`)
  }

  @applicationCommand({
    name: '안녕',
    type: ApplicationCommandType.ChatInput,
    description: '안녕하세요',
  })
  async hello(i: ChatInputCommandInteraction) {
    await i.reply('안녕하세요, 세상이여!')
  }

  @listener({
    event: 'messageCreate',
    emitter: 'discord'
  })
  async heyRas(msg: Message) {
    if (msg.author.bot) return
    if (!msg.content.startsWith('라즈야 ')) return

    const keyword: string = msg.content.slice(4)
    const answer = command.find((cmd) => cmd.question === keyword)

    if (!answer) {
      return await msg.reply('미안, 뭔 말인지 모르겠어..')
    }
    await msg.reply(answer.answer)
  }
}

export const setup = async () => {
  return new HelloExtension()
}
