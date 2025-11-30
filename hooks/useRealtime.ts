'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type RealtimeEvent =
  | { type: 'connected'; userId?: string }
  | { type: 'notification'; data: any }
  | { type: 'message'; data: { taskId: string; message: any } }
  | { type: 'task:created'; data: { taskId: string; task: any } }
  | { type: 'task:updated'; data: { taskId: string; task: any } }
  | { type: 'task:accepted'; data: { taskId: string; task: any } }
  | { type: 'task:completed'; data: { taskId: string; task: any } }
  | { type: 'task:cancelled'; data: { taskId: string; task: any } }
  | { type: 'review:created'; data: { taskId: string; review: any } }
  | { type: 'waitlist:approved'; data: any }
  | { type: 'presence'; data: { userId: string; status: 'online' | 'offline'; timestamp: number } }
  | { type: 'typing'; data: { taskId: string; userId: string; isTyping: boolean } };

type EventCallback = (event: RealtimeEvent) => void;

export function useRealtime() {
  // 🧠 Defensive: make sure this never runs server-side
  if (typeof window === 'undefined') {
    return { connected: false, reconnecting: false, on: () => () => {}, disconnect: () => {} };
  }

  let sessionData;
  try {
    // ✅ Wrap in try/catch — prevents crash if SessionProvider not yet mounted
    sessionData = useSession();
  } catch {
    // ⚡️ Fallback (hook was called before provider mount)
    return { connected: false, reconnecting: false, on: () => () => {}, disconnect: () => {} };
  }

  const { data: session, status } = sessionData || {};

  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!session?.user?.id || status !== 'authenticated') return;
    if (eventSourceRef.current) return;

    console.log('🔌 Connecting to realtime...');
    const es = new EventSource('/api/realtime');

    es.onopen = () => {
      console.log('✅ Connected to realtime');
      setConnected(true);
      setReconnecting(false);
    };

    es.onmessage = (e) => {
      if (!e.data || e.data.startsWith(':')) return;
      try {
        const event: RealtimeEvent = JSON.parse(e.data);
        const listeners = listenersRef.current.get(event.type);
        listeners?.forEach((cb) => cb(event));

        const all = listenersRef.current.get('*');
        all?.forEach((cb) => cb(event));
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    es.onerror = () => {
      console.warn('⚠️ SSE error, reconnecting...');
      setConnected(false);
      setReconnecting(true);
      es.close();
      eventSourceRef.current = null;

      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    eventSourceRef.current = es;
  }, [session?.user?.id, status]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  const on = useCallback((eventType: string, callback: EventCallback): (() => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(callback);

    // ✅ Always return a cleanup function (no void ever)
    return () => {
      const listeners = listenersRef.current.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) listenersRef.current.delete(eventType);
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) connect();
    return () => disconnect();
  }, [status, session?.user?.id, connect, disconnect]);

  return { connected, reconnecting, on, disconnect };
}
