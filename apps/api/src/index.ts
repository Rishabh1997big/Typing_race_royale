import { app } from './app'
import { env } from './config/env'

const server = Bun.serve({
  port: env.API_PORT,
  fetch: app.fetch,
})

console.log(`API listening on http://localhost:${server.port}`)
