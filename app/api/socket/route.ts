import { NextRequest } from "next/server";

// Simple message broadcasting without Socket.IO server dependency
const clients = new Set<{ send: (data: any) => void }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Handle Server-Sent Events for real-time updates
  if (searchParams.get('events') === 'true') {
    const encoder = new TextEncoder();
    
    const customReadable = new ReadableStream({
      start(controller) {
        // Add client to the set with connection state tracking
        let isConnected = true;
        const client = {
          send: (data: any) => {
            if (!isConnected) return;
            
            try {
              const message = `data: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(encoder.encode(message));
            } catch (error) {
              console.error('Error sending SSE message:', error);
              isConnected = false;
              clients.delete(client);
            }
          }
        };
        
        clients.add(client);
        
        // Send initial connection message
        client.send({ type: 'connected', message: 'Connected to chat events' });
        
        // Keep connection alive with periodic ping
        const pingInterval = setInterval(() => {
          if (!isConnected) {
            clearInterval(pingInterval);
            return;
          }
          
          try {
            client.send({ type: 'ping', timestamp: Date.now() });
          } catch (error) {
            clearInterval(pingInterval);
            isConnected = false;
            clients.delete(client);
          }
        }, 30000);
        
        // Cleanup when connection closes
        return () => {
          isConnected = false;
          clearInterval(pingInterval);
          clients.delete(client);
        };
      }
    });
    
    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  }
  
  return new Response("Chat event server initialized", { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Broadcast message to all connected clients with error handling
    const clientsToRemove = new Set<{ send: (data: any) => void }>();
    
    clients.forEach(client => {
      try {
        client.send(data);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        clientsToRemove.add(client);
      }
    });
    
    // Remove disconnected clients
    clientsToRemove.forEach(client => clients.delete(client));
    
    return new Response(JSON.stringify({ success: true, clientCount: clients.size }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat broadcast:', error);
    return new Response('Error broadcasting message', { status: 500 });
  }
}