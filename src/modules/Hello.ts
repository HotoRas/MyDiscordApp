import { searchCommand } from './LearnIt'
import { Extension, applicationCommand, listener } from '@pikokr/command.ts'
import { ApplicationCommandType, ChatInputCommandInteraction, Message } from 'discord.js'
import { log } from 'console'

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
    const query: any = await searchCommand(keyword)

    if (query.rowCount === 0) {
      return await msg.reply('미안, 뭔 말인지 모르겠어..')
    }
    const answer = query.rows[0].answer
    await msg.reply(answer)
  }
}

export const setup = async () => {
  return new HelloExtension()
}
