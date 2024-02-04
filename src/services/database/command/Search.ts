import { pgConnection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { LearnableCommand } from '../../../interfaces/LearnableCommand'
import { commandTable } from './Default'

/**
 * 본격적으로 더러워짐 -> 저도 몰라서 doc 작성합니다.
 * 
 * 동적 명령어를 검색해 리턴합니다.
 * 
 * @param mycmd 
 * @returns 쿼리 결과
 * @throws error: 쿼리 오류. 보통 서버가 없거나 파일을 못 찾았거나.
 */
export const searchCommand = async (cmd: string): Promise<QueryResult<LearnableCommand>> => {
    const database: PoolClient = await pgConnection.connect()
    const searchQuery: string = `select * from ${commandTable} where command = $1;`
    const params: string[] = [cmd]
    try {
        return new Promise<QueryResult>((resolve, rejects) => {
            database.query<LearnableCommand>(searchQuery, params, (err, res) => {
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