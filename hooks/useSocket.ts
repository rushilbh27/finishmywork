'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io(url, {
      path: '/api/socketio',
    })

    socketInstance.on('connect', () => {
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.close()
    }
  }, [url])

  return { socket, connected }
}
