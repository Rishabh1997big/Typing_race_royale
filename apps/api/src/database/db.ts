import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { env } from '@/config/env'
import type { Database } from './types'

// Only repositories should import `db`; services and routes go through them.
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: env.DATABASE_URL }),
  }),
})
