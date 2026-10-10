import { Hono } from 'hono'

// HTTP app composition: global middleware and module routers are mounted here.
// Kept free of Bun.serve so integration tests can call `app.request()` directly.
export const app = new Hono()

app.get('/api/health', (c) => c.json({ status: 'ok' }))
