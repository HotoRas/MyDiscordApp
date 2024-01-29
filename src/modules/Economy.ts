import { connection } from '../pgsql'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { log } from 'console'
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collector, EmbedBuilder, InteractionCollector, InteractionResponse, MessageComponentInteraction, Snowflake } from 'discord.js'
import { User, addMoney, searchUser } from './Register'
import { PoolClient, QueryResult } from 'pg'
import { checkKimustoryCommunityLounge } from './Hello'

type Company = {
    name: string
    owner: Snowflake
    guild: Snowflake | ''
    money: number
}
const CompanyTable: string = 'public.companies'

const searchCompany = async (name: string, owner: string): Promise<QueryResult<Company>> => {
    const database: PoolClient = await connection.connect()
    const searchQuery: string = `select * from ${CompanyTable} where name = $1 or owner = $2;`
    const params: string[] = [name, owner]
    try {
        return new Promise<QueryResult<Company>>((resolve, rejects) => {
            database.query<Company>(searchQuery, params, (err, res) => {
                if (err) {
                    log('error: error on Economy.ts:22:')
                    log(err)
                    rejects(err)
                }
                resolve(res)
            })
        })
    } catch (err) { throw (err) }
    finally { database.release() }
}

/**
 * adds company
 * @param name name of company
 * @param owner company's owner (snowflake)
 * @param guild executing guild snowflake
 * @returns 
 */
const addCompany = async (name: string, owner: string, guild: string | null, money: number): Promise<number> => {
    if (guild === null) return 500
    const database: PoolClient = await connection.connect()
    const addQuery: string = `insert into ${CompanyTable} values ($1, $2, $3, $4::bigint);`
    const value: string[] = [name, owner, guild, money.toString()]
    try {
        let result: QueryResult<Company> = await searchCompany(name, owner)
        log(result.rows)
        if (result.rowCount === null) { return 500 }
        if (result.rowCount > 0) { return 201 }

        result = await new Promise<QueryResult<Company>>((resolve, rejects) => {
            database.query<Company>(addQuery, value, (err, res) => {
                if (err) { rejects(err) }
                resolve(res)
            })
        })
    } catch (err) {
        log(err)
        return 500
    } finally { database.release() }
    return 200
}

const updateCompanyMoney = async (owner: string, guild: string | null, money: number): Promise<number> => {
    if (guild === null) return 500
    const database: PoolClient = await connection.connect()
    const updateQuery: string = `update ${CompanyTable} set money = $3::bigint where owner = $1 and guild = $2`
    const value: string[] = [owner, guild, money.toString()]
    try {
        await new Promise<QueryResult<Company>>((resolve, rejects) => {
            database.query<Company>(updateQuery, value, (err, res) => {
                if (err) { rejects(err) }
                resolve(res)
            })
        })
        return 200
    } catch (err) {
        log(err)
        return 500
    } finally { database.release() }
}

const deleteCompany = async (name: string, owner: string): Promise<number> => {
    const database: PoolClient = await connection.connect()
    const updateQuery: string = `delete from ${CompanyTable} where name = $1 and owner = $2;`
    const value: string[] = [name, owner]
    try {
        await new Promise<QueryResult<Company>>((resolve, rejects) => {
            database.query<Company>(updateQuery, value, (err, res) => {
                if (err) { rejects(err) }
                resolve(res)
            })
        })
        return 200
    } catch (err) {
        log(err)
        return 500
    } finally { database.release() }
}

class EconomyExtension extends Extension {
    @applicationCommand({
        name: '내돈',
        type: ApplicationCommandType.ChatInput,
        description: '지금 돈을 보여드려요',
    })
    async myMoney(i: ChatInputCommandInteraction) {
        //if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return

        let user: QueryResult<User>
        try {
            user = await searchUser(i.user.id)
        }
        catch {
            return await i.reply('사용자 검색에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (user.rowCount === 0) {
            return await i.reply("사용자가 등록되지 않았어요! '/등록' 명령어로 등록해주세요!")
        }

        const userData: User = user.rows[0]
        const embed: EmbedBuilder = new EmbedBuilder()
            .setTitle(userData.name)
            .addFields(
                { name: '돈', value: userData.balance.toString() }
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
        let userData: QueryResult<User>
        try {
            userData = await searchUser(i.user.id)
        }
        catch {
            return await i.reply('사용자 검색에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (userData.rowCount === 0) {
            return await i.reply("사용자가 등록되지 않았어요! '/등록' 명령어로 등록해주세요!")
        }
        const user: User = userData.rows[0]
        const _company: QueryResult<Company> = await searchCompany(companyName, user.id)
        if (_company.rowCount === null) { }
        else if (_company.rowCount > 0) { return await i.reply('이미 진행중인 투자가 있어요!') }

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
            const _updatemoney = async (money: number): Promise<number> => updateCompanyMoney(user.id, i.guildId, money)
            const _deletecomp = async (): Promise<number> => deleteCompany(companyName, user.id)
            let _errorcode: number = await addCompany(companyName, user.id, i.guildId, money)
            turn++
            money = Math.floor(money * 0.95)

            const event: number = Math.random() * 100
            let eventMsg: string

            if (event < 5 || money <= 10) {
                // broke
                money = 0
                eventMsg = '파산했습니다! 자산 가치가 0이 되었습니다.'
                const _tot: number = money
                _errorcode = await _deletecomp()

                const embed: EmbedBuilder = new EmbedBuilder()
                    .setTitle('파산했습니다!')
                    .setDescription(`**${companyName}**이(가) 망했습니다.`)

                await i.editReply({ embeds: [embed], components: [] })
                return false
            } else if (event < 25) {
                // 손해
                const lossPercentage: number = Math.floor(Math.random() * (30 - 10 + 1) + 10);
                const lossAmount: number = Math.floor((money * lossPercentage) / 100);
                money -= lossAmount;
                eventMsg = `손해를 봤습니다!\n **${companyName}**의 가치가 ${lossPercentage}% 감소했습니다.`;
            } else if (event < 30) {
                // 무난한 순항
                eventMsg = `무난한 순항입니다.\n **${companyName}**의 가치가 변동이 없습니다.`;
            } else if (event < 50) {
                // 좋은 일
                const gainPercentage: number = Math.floor(Math.random() * (30 - 10 + 1) + 10);
                const gainAmount: number = Math.floor((money * gainPercentage) / 100);
                money += gainAmount;
                eventMsg = `좋은 일이 생겼습니다!\n **${companyName}**의 가치가 ${gainPercentage}% 증가했습니다.`;
            } else if (event < 99.9) {
                // 대박
                const jackpotMultiplier: number = Math.floor(Math.random() * (200 - 100 + 1) + 100);
                const jackpotAmount: number = Math.floor((money * jackpotMultiplier) / 100);
                money += jackpotAmount;
                eventMsg = `대박이야!\n **${companyName}**의 가치가 ${jackpotMultiplier}% 증가했습니다.`;
            } else {
                // 초대박
                const megaJackpotMultiplier: number = 500;
                const megaJackpotAmount: number = Math.floor((money * megaJackpotMultiplier) / 100);
                money += megaJackpotAmount;
                eventMsg = `초대박이야!\n **${companyName}**의 가치가 ${megaJackpotMultiplier}% 증가했습니다.`;
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
            await _updatemoney(money)
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
                    addMoney(user.id, earnt)
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

export const setup = async () => {
    return new EconomyExtension()
}