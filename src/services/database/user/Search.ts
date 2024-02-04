import { pgConnection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { RasBotUser } from '../../../interfaces/RasbotUser'
import { userTable } from './Default'

/**
 * 사용자를 검색해 리턴합니다.
 * 
 * @param id: 검색할 사용자의 snowflake 
 * @returns 쿼리 결과
 * @throws error: 쿼리 오류. 보통 서버가 없거나 파일을 못 찾았거나.
 */
export const searchUser = async (id: string): Promise<QueryResult<RasBotUser>> => {
    const database: PoolClient = await pgConnection.connect()
    const searchQuery: string = `select * from ${userTable} where id = $1;`
    const params: string[] = [id]
    try {
        return new Promise<QueryResult<RasBotUser>>((resolve, rejects) => {
            database.query<RasBotUser>(searchQuery, params, (err, res) => {
                if (err) {
                    log('error: error on Register.ts:57:')
                    log(err)
                    rejects(err)
                }
                resolve(res)
            })
        })
    } catch (err) { throw (err) }
    finally { database.release() }
}