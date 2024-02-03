import { Extension, applicationCommand } from '@pikokr/command.ts'
import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js'
import { QueryResult } from 'pg'
import { isSameDate, getYesterday } from '../services/date/DateService'
import { RasBotUser } from '../interfaces/RasbotUser'
import { addUser, searchUser, addMoney } from '../services/database/user'

class UserRegisterExtension extends Extension {
    @applicationCommand({
        name: '등록',
        type: ApplicationCommandType.ChatInput,
        description: '여러분의 이름을 알려주세요! (경제 시스템을 이용하려면 필요합니다)'
    })
    async register(i: ChatInputCommandInteraction) {
        //if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        let result: number = 0
        const uid = i.user.id
        const uname = i.user.username.endsWith('#0') ? i.user.username.slice(0, -2) : i.user.username
        try {
            result = await addUser(uid, uname)
        } catch {
            return await i.reply('사용자 등록에 실패했어요.\n봇 관리자에게 문의해주세요!')
        }
        if (result === 200) {
            return await i.reply(`등록에 성공했어요! 아이디: ${uid}, 닉네임: ${uname}`)
        }
        if (result === 201) {
            return await i.reply(`사용자 정보를 갱신했어요! 아이디: ${uid}, 닉네임: ${uname}`)
        }
        if (result === 500) {
            return await i.reply('사용자 등록에 실패했어요...\n데이터베이스에 사용자 정보를 저장하지 못했어요. 봇 관리자에 문의해주세요!')
        }
        if (result === 401) {
            return await i.reply('이미 등록되어 있어요!')
        }
    }
    @applicationCommand({
        name: '출석',
        type: ApplicationCommandType.ChatInput,
        description: '출석체크! 100 코인을 받아요!'
    })
    async daily(i: ChatInputCommandInteraction) {
        if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        let lastVis: Date
        let rasBotUser: QueryResult<RasBotUser>
        try {
            rasBotUser = await searchUser(i.user.id)
            //log(rasBotUser)
            lastVis = rasBotUser.rows[0].lastvisit
        } catch {
            return await i.reply('사용자 검색에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (rasBotUser.rowCount === 0 || rasBotUser.rowCount === null) {
            return await i.reply("사용자 등록이 되어 있지 않아요! '/등록' 명령어를 이용해 등록해주세요.")
        }

        const now: Date = new Date(Date.now())
        //log(lastVis)
        //log(now)
        //log(`${lastVis.getDate()}, ${lastVis.getDay()}, ${lastVis.getFullYear()}`)
        //log(`${now.getDate()}, ${now.getDay()}, ${now.getFullYear()}`)
        if (isSameDate(lastVis, now)) {
            return await i.reply('하루에 한 번만 출석체크할 수 있어요. 자정 (한국 시간) 이후에 다시 시도해주세요!')
        }
        const add: number = isSameDate(lastVis, getYesterday()) ? 150 : 100
        let result: number = 0
        try {
            result = await addMoney(i.user.id, add, true)
        } catch {
            return await i.reply('출석체크에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (result === 200) {
            return await i.reply(`출석체크가 완료되었습니다! 현재 돈: ${Number(rasBotUser.rows[0].balance) + add}`)
        }
        if (result === 500) {
            return await i.reply('출석체크에 실패했어요.\n데이터베이스에 사용자 정보를 저장하지 못했어요. 봇 관리자에 문의해주세요!')
        }
        if (result === 403) {
            return await i.reply("사용자 정보가 등록되어 있지 않아요. '/등록' 명령어로 등록해주세요!")
        }
    }
}

export const setup = async () => { return new UserRegisterExtension() }