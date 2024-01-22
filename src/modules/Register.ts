import { connection } from '../pgsql'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { log } from 'console'
import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js'

const userTable: string = 'public.user'

function isSameDate(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getDay() === b.getDay() && a.getFullYear() === b.getFullYear()
}

function getYesterday(): Date {
    const today = new Date(Date.now())
    let yyyy = today.getFullYear()
    let mm = today.getMonth()
    let dd = today.getDate()
    dd -= 1
    if (dd === 0) {
        mm -= 1
        if (mm === 0) {
            yyyy -= 1
            mm = 12
        }
        if (mm === 4 || mm === 6 || mm === 9 || mm === 11) dd = 30
        else if (mm === 2) {
            if (yyyy % 4 === 0 && (yyyy % 100 !== 0 || yyyy % 400 === 0)) mm = 29
            else { mm = 28 }
        }
        else mm = 30
    }
    return new Date(yyyy, mm, dd)
}

/**
 * 사용자를 검색해 리턴합니다.
 * 
 * @param id: 검색할 사용자의 snowflake 
 * @returns 쿼리 결과
 * @throws error: 쿼리 오류. 보통 서버가 없거나 파일을 못 찾았거나.
 */
export const searchUser = async (id: string) => {
    const database = await connection.connect()
    const searchQuery: string = `select * from ${userTable} where id = $1;`
    const params = [id]
    try {
        return new Promise((resolve, rejects) => {
            database.query(searchQuery, params, (err, res) => {
                if (err) {
                    log('error: error on Register.ts:23:')
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
 * 사용자를 DB에 추가합니다.
 * @param id 추가할 사용자의 snowflake
 * @param name 추가할 사용자의 닉네임
 * @returns 200: 성공; 201: 갱신됨; 500: 오류; 401: 이미 존재함
 */
export const addUser = async (id: string, name: string) => {
    const database = await connection.connect()
    const addQuery: string = `insert into ${userTable} values ( $1, $2, 0, $3 );`
    const value: string[] = [id, name, '2000-01-01']
    try {
        let result: any = await searchUser(id)
        log(result.rows)
        if (result.rowCount > 0) {
            if (result.rows[0].name === name)
                return 401 // exist
            else {
                result = await new Promise((resolve, rejects) => {
                    database.query(`update ${userTable} set name = $2 where id = $1`, value, (err, res) => {
                        if (err) { rejects(err) }
                        resolve(res)
                    })
                })
                return 201 // updated
            }

        }
        else {
            result = await new Promise((resolve, rejects) => {
                database.query(addQuery, value, (err, res) => {
                    if (err) { rejects(err) }
                    resolve(res)
                })
            })
        }
    } catch (err) {
        log(err)
        return 500 // server offline
    } finally { database.release() }
    return 200 // add done
}

/**
 * 돈을 추가합니다. 0원이 될 수도.. 있네요?
 * @param id 
 * @param moneyDelta 
 * @returns 200: 처리 완료; 500: 오류; 403: 찾을 수 없음
 */
export const addMoney = async (id: string, moneyDelta: number, updateDate?: boolean) => {
    const database = await connection.connect()
    const addQuery: string = `update ${userTable} set balance = $2${updateDate ? ' , lastvisit = NOW() :: DATE' : ''} where id = $1::varchar`
    //log(addQuery)
    let result: any
    try {
        result = await searchUser(id)
    }
    catch {
        return 403 // not found
    }
    if (result.rowCount === 0) {
        return 403 // not found
    }
    //log(result.rows[0].balance)
    const value = [id, (moneyDelta + Number(result.rows[0].balance)) < 0 ? 0 : moneyDelta + Number(result.rows[0].balance)]
    //log(value)
    try {
        result = await new Promise((resolve, rejects) => {
            database.query(addQuery, value, (err, res) => {
                if (err) { rejects(err) }
                resolve(res)
            })
        })
    } catch (err) {
        return 500 // server offline
    } finally { database.release() }
    return 200 // add done
}

class UserRegisterExtension extends Extension {
    @applicationCommand({
        name: '등록',
        type: ApplicationCommandType.ChatInput,
        description: '여러분의 이름을 알려주세요! (경제 시스템을 이용하려면 필요합니다)'
    })
    async register(i: ChatInputCommandInteraction) {
        if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        let returned: number = 0
        const uid = i.user.id
        const uname = i.user.username.endsWith('#0') ? i.user.username.slice(0, -2) : i.user.username
        try {
            returned = await addUser(uid, uname)
        } catch {
            return await i.reply('사용자 등록에 실패했어요.\n봇 관리자에게 문의해주세요!')
        }
        if (returned === 200) {
            return await i.reply(`등록에 성공했어요! 아이디: ${uid}, 닉네임: ${uname}`)
        }
        if (returned === 201) {
            return await i.reply(`사용자 정보를 갱신했어요! 아이디: ${uid}, 닉네임: ${uname}`)
        }
        if (returned === 500) {
            return await i.reply('사용자 등록에 실패했어요...\n데이터베이스에 사용자 정보를 저장하지 못했어요. 봇 관리자에 문의해주세요!')
        }
        if (returned === 401) {
            return await i.reply('이미 등록되어 있어요!')
        }
    }
    @applicationCommand({
        name: '출석',
        type: ApplicationCommandType.ChatInput,
        description: '출석체크! 100 코인을 받아요!'
    })
    async learnIt(i: ChatInputCommandInteraction) {
        if (i.guildId === "604137297033691137" && i.channelId === "858627537994383401") return
        let lastVis: Date
        let uData: any
        try {
            uData = await searchUser(i.user.id)
            //log(uData)
            lastVis = uData.rows[0].lastvisit
        } catch {
            return await i.reply('사용자 검색에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (uData.rowCount === 0) {
            return await i.reply("사용자 등록이 되어 있지 않아요! '/등록' 명령어를 이용해 등록해주세요.")
        }

        const now = new Date(Date.now())
        //log(lastVis)
        //log(now)
        //log(`${lastVis.getDate()}, ${lastVis.getDay()}, ${lastVis.getFullYear()}`)
        //log(`${now.getDate()}, ${now.getDay()}, ${now.getFullYear()}`)
        if (isSameDate(lastVis, now)) {
            return await i.reply('하루에 한 번만 출석체크할 수 있어요. 자정 (한국 시간) 이후에 다시 시도해주세요!')
        }
        let returned: number = 0
        try {
            returned = await addMoney(i.user.id, isSameDate(lastVis, getYesterday()) ? 150 : 100, true)
        } catch {
            return await i.reply('출석체크에 실패했어요.\n사용자 정보 데이터베이스에 연결할 수 없어요. 봇 관리자에 문의해주세요.')
        }
        if (returned === 200) {
            return await i.reply(`출석체크가 완료되었습니다! 현재 돈: ${Number(uData.rows[0].balance) + (isSameDate(lastVis, getYesterday()) ? 150 : 100)}`)
        }
        if (returned === 500) {
            return await i.reply('출석체크에 실패했어요.\n데이터베이스에 사용자 정보를 저장하지 못했어요. 봇 관리자에 문의해주세요!')
        }
        if (returned === 403) {
            return await i.reply("사용자 정보가 등록되어 있지 않아요. '/등록' 명령어로 등록해주세요!")
        }
    }
}

export const setup = async () => {
    return new UserRegisterExtension()
}