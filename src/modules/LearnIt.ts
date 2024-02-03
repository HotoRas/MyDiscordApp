import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js'
import { addCommand } from '../services/database/command'

class LearnitExtension extends Extension {
    @applicationCommand({
        name: '배워',
        type: ApplicationCommandType.ChatInput,
        description: '라즈한테 이것저것 가르쳐줘봐요!'
    })
    async learnIt(
        i: ChatInputCommandInteraction,
        @option({
            type: ApplicationCommandOptionType.String,
            name: '명령어',
            description: "이걸 '라즈야'로 물어보면 답해줄 거에요!",
            required: true
        })
        question: string,
        @option({
            type: ApplicationCommandOptionType.String,
            name: '대답',
            description: '라즈가 할 대답이에요!',
            required: true
        })
        answer: string
    ) {
        // if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        let returned: number = 0
        try {
            returned = await addCommand(question, answer, i.user.id)
        } catch {
            return await i.reply('명령어 추가에 실패했어요...\n데이터를 저장하는 중 문제가 발생했어요. 봇 관리자에 문의해주세요!')
        }
        if (returned === 200) {
            return await i.reply(`이제 '라즈야 ${question}'(으)로 물어보면 ${answer}(으)로 답해줄거에요!`)
        }
        if (returned === 500) {
            return await i.reply('명령어 추가에 실패했어요...\n데이터베이스에 명령어를 저장하지 못했어요. 봇 관리자에 문의해주세요!')
        }
        if (returned === 403) {
            return await i.reply(`기존 '라즈야 ${question}' 명령어가 수정할 수 없게 되어 있는 것 같아요!`)
        }
    }
}

export const setup = async () => { return new LearnitExtension() }