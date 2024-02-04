import { pgConnection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { RasbotCompany } from '../../../interfaces/Company'
import { CompanyTable } from './Default'
import { searchCompany } from './Search'

/**
 * adds company
 * @param name name of company
 * @param owner company's owner (snowflake)
 * @param guild executing guild snowflake
 * @returns 
 */
export const addCompany = async (name: string, owner: string, guild: string | null, money: number): Promise<number> => {
    if (guild === null) return 500
    const database: PoolClient = await pgConnection.connect()
    const addQuery: string = `insert into ${CompanyTable} values ($1, $2, $3, $4::bigint);`
    const value: string[] = [name, owner, guild, money.toString()]
    try {
        let result: QueryResult<RasbotCompany> = await searchCompany(name, owner)
        log(result.rows)
        if (result.rowCount === null) { return 500 }
        if (result.rowCount > 0) { return 201 }

        result = await new Promise<QueryResult<RasbotCompany>>((resolve, rejects) => {
            database.query<RasbotCompany>(addQuery, value, (err, res) => {
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