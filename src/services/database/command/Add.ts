import { pgConnection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { LearnableCommand } from '../../../interfaces/LearnableCommand'
import { commandTable } from './Default'
import { searchCommand } from './Search'
import { Snowflake } from 'discord.js'

/**
 * 명령어를 DB에 추가합니다.
 * @param command 추가할 명령어
 * @param answer 추가할 대답
 * @returns 200: 성공; 500: 오류; 403: 수정할 수 없음
 */
export const addCommand = async (command: string, answer: string, teacher: Snowflake): Promise<number> => {
    const database: PoolClient = await pgConnection.connect()
    const addQuery: string = `insert into ${commandTable} values ( $1, $2, true, $3 );`
    try {
        let result: QueryResult<LearnableCommand> = await searchCommand(command)
        if (result.rowCount === null) result.rowCount = 0
        if (result.rowCount > 0) {
            if (!result.rows[0].editable) {
                return 403 // no permission
            }
            const query: string = `update ${commandTable} set answer = $2 , learnfrom = $3 where command = $1;`
            result = await new Promise<QueryResult<LearnableCommand>>((resolve, rejects) => {
                database.query<LearnableCommand>(query, [command, answer, teacher], (err, res) => {
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
            result = await new Promise<QueryResult<LearnableCommand>>((resolve, rejects) => {
                database.query<LearnableCommand>(addQuery, [command, answer, teacher], (err, res) => {
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