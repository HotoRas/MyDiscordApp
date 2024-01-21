import { Pool } from "pg"
import { sqlConfig } from "./config"

export const connection = new Pool({
    user: sqlConfig.user,
    host: sqlConfig.host,
    database: sqlConfig.database,
    password: sqlConfig.password,
    port: sqlConfig.port
})