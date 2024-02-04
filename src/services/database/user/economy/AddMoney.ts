import { pgConnection } from '../../../../pgsql'
import { PoolClient, QueryResult } from 'pg'
import { RasBotUser } from '../../../../interfaces/RasbotUser'
import { searchUser } from '../Search'
import { userTable } from '../Default'


/**
 * 돈을 추가합니다. 0원이 될 수도.. 있네요?
 * @param id 
 * @param moneyDelta 
 * @returns 200: 처리 완료; 500: 오류; 403: 찾을 수 없음
 */
export const addMoney = async (id: string, moneyDelta: number, updateDate?: boolean): Promise<number> => {
    const database: PoolClient = await pgConnection.connect()
    const addQuery: string = `update ${userTable} set balance = $2${updateDate ? ' , lastvisit = NOW() :: DATE' : ''} where id = $1::varchar`
    //log(addQuery)
    let result: QueryResult<RasBotUser>
    try {
        result = await searchUser(id)
    }
    catch {
        return 403 // not found
    }
    if (result.rowCount === 0 || result.rowCount === null) {
        return 403 // not found
    }
    //log(result.rows[0].balance)
    const value: string[] = [id, (moneyDelta + Number(result.rows[0].balance)) < 0 ? '0' : (moneyDelta + Number(result.rows[0].balance)).toString()]
    //log(value)
    try {
        result = await new Promise<QueryResult<RasBotUser>>((resolve, rejects) => {
            database.query<RasBotUser>(addQuery, value, (err, res) => {
                if (err) { rejects(err) }
                resolve(res)
            })
        })
    } catch (err) {
        return 500 // server offline
    } finally { database.release() }
    return 200 // add done
}