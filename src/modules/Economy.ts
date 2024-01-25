import { connection } from '../pgsql'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { log } from 'console'
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js'
import { User } from './Register'

class EconomyExtension extends Extension {
    @applicationCommand({
        name: '내돈',
        type: ApplicationCommandType.ChatInput,
        description: '지금 돈을 보여드려요',
    })
    async myMoney(i: ChatInputCommandInteraction) {
        if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        await i.reply('이 명령어는 준비중이에요!')
    }
    //*
    @applicationCommand({
        name: '창업',
        type: ApplicationCommandType.ChatInput,
        description: '돈 벌기 게임을 시작해봐요!',
    })
    async makeCompany(i: ChatInputCommandInteraction,
        @option({
            type: ApplicationCommandOptionType.String,
            name: '회사이름',
            description: '회사 이름을 정해주세요!',
            required: true
        })
        companyName: string,
        @option({
            type: ApplicationCommandOptionType.Integer,
            name: '돈',
            description: '투입할 돈을 정해주세요!',
            required: true
        })
        money: number
    ) {
        if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        await i.reply('이 명령어는 준비중이에요! 입력 값:\n' + `- 회사 이름: ${companyName}\n` + `- 돈: ${money}`)
    }
    //*/
}

export const setup = async () => {
    return new EconomyExtension()
}