import { connection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { RasbotCompany } from '../../../interfaces/Company'
import { CompanyTable } from './Default'

export const updateCompanyMoney = async (owner: string, guild: string | null, money: number): Promise<number> => {
    if (guild === null) return 500
    const database: PoolClient = await connection.connect()
    const updateQuery: string = `update ${CompanyTable} set money = $3::bigint where owner = $1 and guild = $2`
    const value: string[] = [owner, guild, money.toString()]
    try {
        await new Promise<QueryResult<RasbotCompany>>((resolve, rejects) => {
            database.query<RasbotCompany>(updateQuery, value, (err, res) => {
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