import { pgConnection } from '../../../pgsql'
import { log } from 'console'
import { PoolClient, QueryResult } from 'pg'
import { RasbotCompany } from '../../../interfaces/Company'
import { CompanyTable } from './Default'

export const searchCompany = async (name: string, owner: string): Promise<QueryResult<RasbotCompany>> => {
    const database: PoolClient = await pgConnection.connect()
    const searchQuery: string = `select * from ${CompanyTable} where name = $1 or owner = $2;`
    const params: string[] = [name, owner]
    try {
        return new Promise<QueryResult<RasbotCompany>>((resolve, rejects) => {
            database.query<RasbotCompany>(searchQuery, params, (err, res) => {
                if (err) {
                    log('error: error on Economy.ts:22:')
                    log(err)
                    rejects(err)
                }
                resolve(res)
            })
        })
    } catch (err) { throw (err) }
    finally { database.release() }
}