import { defineConfig } from 'kysely-ctl'
import { db } from './src/database/db'

// kysely-ctl CLI config (used by the db:* scripts). Reuses the app's connection.
export default defineConfig({
  kysely: db,
  migrations: { migrationFolder: 'src/database/migrations' },
  seeds: { seedFolder: 'src/database/seeds' },
})
