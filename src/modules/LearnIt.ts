import { connection } from '../pgsql'
import { Extension, applicationCommand, option } from '@pikokr/command.ts'
import { log } from 'console'
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js'

const commandTable: string = 'public.command'

/**
 * 본격적으로 더러워짐 -> 저도 몰라서 doc 작성합니다.
 * 
 * 동적 명령어를 검색해 리턴합니다.
 * 
 * @param mycmd 
 * @returns 쿼리 결과
 * @throws error: 쿼리 오류. 보통 서버가 없거나 파일을 못 찾았거나.
 */
export const searchCommand = async (cmd: string) => {
    const database = await connection.connect()
    const searchQuery: string = `select * from ${commandTable} where command = $1;`
    const params = [cmd]
    try {
        return new Promise((resolve, rejects) => {
            database.query(searchQuery, params, (err, res) => {
                if (err) {
                    log('error: error on Learnit.ts:30:')
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
 * 명령어를 DB에 추가합니다.
 * @param command 추가할 명령어
 * @param answer 추가할 대답
 * @returns 200: 성공; 500: 오류
 */
export const addCommand = async (command: string, answer: string) => {
    const database = await connection.connect()
    const addQuery: string = `insert into ${commandTable} values ( $1, $2 );`
    try {
        let result: any = await searchCommand(command)
        log(result)
        if (result.rowCount > 0) {
            const query: string = `update ${commandTable} set answer = $2 where command = $1;`
            result = await new Promise((resolve, rejects) => {
                database.query(query, [command, answer], (err, res) => {
                    if (err) {
                        log('error: error on Learnit.ts:58:')
                        log(err)
                        rejects(err)
                    }
                    resolve(res)
                })
            })
        }
        else {
            result = await new Promise((resolve, rejects) => {
                database.query(addQuery, [command, answer], (err, res) => {
                    if (err) { rejects(err) }
                    resolve(res)
                })
            })
        }
    } catch (err) {
        return 500 // server offline
    } finally { database.release() }
    return 200 // add done
}

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
        let returned: number = 0
        try {
            returned = await addCommand(question, answer)
        } catch {
            return await i.reply('명령어 추가에 실패했어요...\n데이터를 저장하는 중 문제가 발생했어요. 봇 관리자에 문의해주세요!')
        }
        if (returned === 200) {
            return await i.reply(`이제 '라즈야 ${question}'(으)로 물어보면 ${answer}(으)로 답해줄거에요!`)
        }
        if (returned === 500) {
            return await i.reply('명령어 추가에 실패했어요...\n데이터베이스에 명령어를 저장하지 못했어요. 봇 관리자에 문의해주세요!')
        }
    }
}

export const setup = async () => {
    return new LearnitExtension()
}