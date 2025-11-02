import { Client, type Notification } from 'pg'
import { emitTaskUpdate, TaskUpdateEvent } from './socket'

let initialized = false

export async function ensurePgRealtime() {
  if (initialized) return
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    await client.connect()
    await client.query('LISTEN task_events')

  client.on('notification', async (msg: Notification) => {
      try {
        const payload = JSON.parse(msg.payload || '{}') as TaskUpdateEvent
        // Forward DB event to Socket.IO clients
        await emitTaskUpdate(payload)
      } catch (e) {
        console.error('Failed to handle task_events payload:', e)
      }
    })

    client.on('error', (err: unknown) => {
      console.error('pg realtime client error:', err)
    })

    initialized = true
    console.log('Neon Realtime (LISTEN/NOTIFY) connected on channel task_events')
  } catch (e) {
    console.error('Failed to initialize Neon Realtime listener:', e)
  }
}
