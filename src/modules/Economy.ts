import { connection } from '../pgsql'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { log } from 'console'
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse, MessageComponentInteraction, Snowflake } from 'discord.js'
import { RasBotUser } from '../interfaces/RasbotUser'
import { searchUser, addMoney } from '../services/database/user'
import { PoolClient, QueryResult } from 'pg'
import { checkKimustoryCommunityLounge } from './Hello'
import { InvestEvent, InvestEventChance, InvestEventResult } from '../services/database/economy'
import { addCompany, deleteCompany, searchCompany, updateCompanyMoney } from '../services/database/economy'
import { RasbotCompany } from '../interfaces/Company'

class EconomyExtension extends Extension {
    @applicationCommand({
        name: '내돈',
        type: ApplicationCommandType.ChatInput,
        description: '지금 돈을 보여드려요',
    })
    async myMoney(i: ChatInputCommandInteraction) {
        //if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return

        let userQuery: QueryResult<RasBotUser>
        try {
            userQuery = await searchUser(i.user.id)
        }
        catch {
            return await i.reply('사용자 검색에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (userQuery.rowCount === 0) {
            return await i.reply("사용자가 등록되지 않았어요! '/등록' 명령어로 등록해주세요!")
        }

        const rasBotUser: RasBotUser = userQuery.rows[0]
        const embed: EmbedBuilder = new EmbedBuilder()
            .setTitle(rasBotUser.name)
            .addFields(
                { name: '돈', value: rasBotUser.balance.toString() }
            )

        await i.reply({ embeds: [embed] })
    }
    //*

    // 내부 함수 출처: https://github.com/Aleu0091/kimu-mission-9/blob/main/index.js#L403
    @applicationCommand({
        name: '창업',
        type: ApplicationCommandType.ChatInput,
        description: '돈 벌기 게임을 시작해봐요! 경고: 10코인 미만으로 떨어지면 파산이에요!',
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
        if (checkKimustoryCommunityLounge(i)) return
        if (i.guildId === null) {
            return await i.reply('DM에서는 실행할 수 없어요! 서버에서 실행해주세요.')
        }
        if (money <= 30) {
            return await i.reply('돈은 30코인 미만으로 설정할 수 없어요! 30코인 이상으로 설정해주세요.')
        }
        //*
        let userQuery: QueryResult<RasBotUser>
        try {
            userQuery = await searchUser(i.user.id)
        }
        catch {
            return await i.reply('사용자 검색에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (userQuery.rowCount === 0) {
            return await i.reply("사용자가 등록되지 않았어요! '/등록' 명령어로 등록해주세요!")
        }
        const rasBotUser: RasBotUser = userQuery.rows[0]
        const companyQuery: QueryResult<RasbotCompany> = await searchCompany(companyName, rasBotUser.id)
        if (companyQuery.rowCount === null) { }
        else if (companyQuery.rowCount > 0) { return await i.reply('이미 진행중인 투자가 있어요!') }

        const startEmbed: EmbedBuilder = new EmbedBuilder()
            .setTitle('투자 시작!')
            .setDescription(`**${companyName}**에 ${money} 코인을 투자했습니다.`)
        const finishBtn: ButtonBuilder = new ButtonBuilder()
            .setCustomId('exitInvest')
            .setLabel('사업 철수')
            .setStyle(ButtonStyle.Danger)
        const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(finishBtn)
        const respond: InteractionResponse = await i.reply({ embeds: [startEmbed], components: [row] })
        let turn: number = 0

        const investRun = async () => {
            const companyUpdateMoney = async (money: number): Promise<number> => updateCompanyMoney(rasBotUser.id, i.guildId, money)
            const _deletecomp = async (): Promise<number> => deleteCompany(companyName, rasBotUser.id)
            let _errorcode: number = await addCompany(companyName, rasBotUser.id, i.guildId, money)
            turn++
            let eventMsg: string

            money = Math.floor(money * 0.95)

            const invEvent: InvestEventResult = InvestEvent(money)
            money = invEvent.result
            const difference: number = invEvent.diff

            switch (invEvent.state) {
                case InvestEventChance.BROKE: {
                    _errorcode = await _deletecomp()
                    const embed: EmbedBuilder = new EmbedBuilder()
                        .setTitle('파산했습니다!')
                        .setDescription(`**${companyName}**이(가) 망했습니다.`)

                    await i.editReply({ embeds: [embed], components: [] })
                    return false
                }
                case InvestEventChance.MINUS: {
                    eventMsg = `손해를 봤습니다!\n **${companyName}**의 가치가 ${difference}% 감소했습니다.`
                    break
                }
                case InvestEventChance.GOOD: {
                    eventMsg = `좋은 일이 생겼습니다!\n **${companyName}**의 가치가 ${difference}% 증가했습니다.`
                    break
                }
                case InvestEventChance.GREAT: {
                    eventMsg = `대박이야!\n **${companyName}**의 가치가 ${difference}% 증가했습니다.`
                    break
                }
                case InvestEventChance.WONDERFUL: {
                    eventMsg = `초대박이야!\n **${companyName}**의 가치가 ${difference}% 증가했습니다.`
                    break
                }
                case InvestEventChance.STATIC:
                default: {
                    eventMsg = `무난한 순항입니다.\n **${companyName}**의 가치가 변동이 없습니다.`
                    break
                }
            }

            const embed: EmbedBuilder = new EmbedBuilder()
                .setTitle(`턴 ${turn}`)
                .setDescription(eventMsg + `\n현재 가치: ${money}`)
                .setFooter({
                    text: '※ 수수료 5%가 자동 납부되었습니다.'
                })
            const collectorFilter = (j: MessageComponentInteraction): boolean => j.user.id === i.user.id
            try {
                await i.editReply({ embeds: [embed], components: [row] })
            } catch (e) {
                console.log(e)
            }
            await companyUpdateMoney(money)
            try {
                const _confirm = await respond.awaitMessageComponent({
                    filter: collectorFilter, time: 5_000
                })

                if (_confirm.customId === 'exitInvest') {
                    const earnt: number = money
                    await _deletecomp()
                    const embed: EmbedBuilder = new EmbedBuilder()
                        .setTitle('사업 철수!')
                        .setDescription(`**${companyName}**에서 ${earnt} 코인을 얻었습니다.`)
                    addMoney(rasBotUser.id, earnt)
                    const finishBtn: ButtonBuilder = new ButtonBuilder()
                        .setCustomId('exitInvest')
                        .setLabel('사업 철수')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                    const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(finishBtn)

                    try {
                        await i.editReply({ embeds: [embed], components: [row] })
                    } catch (e) { console.log(e) }
                    await _confirm.update({ components: [] })
                }
            } catch (err) {
                setTimeout(() => investRun(), 0)
            }
        }
        investRun()
    }
}

export const setup = async () => { return new EconomyExtension() }