type Config = {
  token: string
  guilds: string[]
}

type SqlConfig = {
  user: string
  host: string
  database: string
  password: string
  port: number
}


// eslint-disable-next-line @typescript-eslint/no-var-requires
export const config: Config = require('../config.json')
export const sqlConfig: SqlConfig = require('../sql-config.json')

export const knex = require('knex')({
  compileSqlOnError: false,
  client: 'pg',
  connection: sqlConfig
})