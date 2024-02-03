import { connection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { RasbotCompany } from '../../../interfaces/Company'
import { CompanyTable } from './Default'

export const deleteCompany = async (name: string, owner: string): Promise<number> => {
    const database: PoolClient = await connection.connect()
    const updateQuery: string = `delete from ${CompanyTable} where name = $1 and owner = $2;`
    const value: string[] = [name, owner]
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