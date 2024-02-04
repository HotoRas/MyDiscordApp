import { pgConnection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { searchUser } from './Search'
import { RasBotUser } from '../../../interfaces/RasbotUser'
import { userTable } from './Default'
/**
 * 사용자를 DB에 추가합니다.
 * @param id 추가할 사용자의 snowflake
 * @param name 추가할 사용자의 닉네임
 * @returns 200: 성공; 201: 갱신됨; 500: 오류; 401: 이미 존재함
 */
export const addUser = async (id: string, name: string): Promise<number> => {
    const database: PoolClient = await pgConnection.connect()
    const addQuery: string = `insert into ${userTable} values ( $1, $2, 0, $3 );`
    const value: string[] = [id, name, '2000-01-01']
    try {
        let result: QueryResult<RasBotUser> = await searchUser(id)
        log(result.rows)
        if (result.rowCount === null) {
            return 500
        }
        if (result.rowCount > 0) {
            if (result.rows[0].name === name)
                return 401 // exist
            else {
                result = await new Promise<QueryResult<RasBotUser>>((resolve, rejects) => {
                    database.query<RasBotUser>(`update ${userTable} set name = $2 where id = $1`, value, (err, res) => {
                        if (err) { rejects(err) }
                        resolve(res)
                    })
                })
                return 201 // updated
            }

        }
        else {
            result = await new Promise<QueryResult<RasBotUser>>((resolve, rejects) => {
                database.query<RasBotUser>(addQuery, value, (err, res) => {
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