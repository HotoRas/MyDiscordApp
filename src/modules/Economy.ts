import { connection } from '../pgsql'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { log } from 'console'
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse, Snowflake } from 'discord.js'
import { User, searchUser } from './Register'
import { PoolClient, QueryResult } from 'pg'

type Company = {
    name: string
    owner: Snowflake
    guild: Snowflake
    money: number
}
const CompanyTable: string = 'public.company'

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
const addCompany = async (name: string, owner: string, guild: string, money: number): Promise<number> => {
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

const updateCompanyMoney = async (owner: string, guild: string, money: number): Promise<number> => {
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
        if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return

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

        const startEmbed: EmbedBuilder = new EmbedBuilder()
            .setTitle('투자 시작!')
            .setDescription(`**${companyName}**에 ${money} 코인을 투자했습니다.`)
        const finishBtn: ButtonBuilder = new ButtonBuilder()
            .setCustomId('exitInvest')
            .setLabel('사업 철수')
            .setStyle(ButtonStyle.Danger)
        const row = new ActionRowBuilder().addComponents(finishBtn)
        // const respond: InteractionResponse = await i.reply({ embeds: [startEmbed], components: [row] }) // error: no overload matches this call on economy.ts:173:97
        i.reply('이 명령어는 준비 중이에요!')
    }
    //*/
}

export const setup = async () => {
    return new EconomyExtension()
}