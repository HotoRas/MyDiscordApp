import { LearnableCommand, searchCommand } from './LearnIt'
import { Extension, applicationCommand, listener, ownerOnly } from '@pikokr/command.ts'
import { ApplicationCommandType, ChatInputCommandInteraction, Message, PermissionFlagsBits } from 'discord.js'
import { log } from 'console'
import { QueryResult } from 'pg'
import { searchUser, tUser } from './Register'

export function checkKimustoryCommunityLounge(m: Message | ChatInputCommandInteraction): boolean {
  return m.guildId === "604137297033691137" && m.channelId === "858627537994383401"
}

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
    if (checkKimustoryCommunityLounge(i)) return
    await i.reply(`안녕하세요, ${i.user.username}님!`)
  }

  /*
  @applicationCommand({
    name: 'kill',
    type: ApplicationCommandType.ChatInput,
    description: '라즈봇을 완전히 종료해요'
  })
  @ownerOnly
  async kill(i: ChatInputCommandInteraction) {
    await i.reply('종료할게요. 다시 실행하려면 봇 관리자에게 문의해주세요.')
    throw new Error()
  }
  */

  @listener({
    event: 'messageCreate',
    emitter: 'discord'
  })
  async heyRas(msg: Message) {
    //if (msg.guildId === "604137297033691137" && msg.channelId === "858627537994383401") return
    if (msg.author.bot) return
    if (!msg.content.startsWith('라즈야 ')) return

    const keyword: string = msg.content.slice(4)
    const query: QueryResult<LearnableCommand> = await searchCommand(keyword)

    if (query.rowCount === 0 || query.rowCount === null) {
      return await msg.reply('미안, 뭔 말인지 모르겠어..')
    }
    const result: LearnableCommand = query.rows[0]
    log(`Command found: ${result.command} --> ${result.answer}; editable: ${result.editable}; from: ${result.learnfrom}`)
    const answer: string = query.rows[0].answer
    const getUser: QueryResult<tUser> = await searchUser(result.learnfrom)
    const learnfrom: string = '\n`' + getUser.rowCount ? getUser.rows[0].name : result.learnfrom + ' 님이 가르쳐 주셨어요!`'
    await msg.reply(answer/* + learnfrom*/)
  }
}

export const setup = async () => { return new HelloExtension() }
