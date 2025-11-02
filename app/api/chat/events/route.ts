import { messageBroadcaster } from '@/lib/messageBroadcaster';

// Server-Sent Events endpoint for real-time chat updates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return new Response('Task ID required', { status: 400 });
  }

  const clientId = Math.random().toString(36).substr(2, 9);
  console.log(`🔗 SSE client ${clientId} connected for task ${taskId}`);

  const stream = new ReadableStream({
    start(controller) {
      // Add client to broadcaster
      messageBroadcaster.addClient(clientId, controller, taskId);
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', taskId, clientId });
      controller.enqueue(`data: ${data}\n\n`);

      // Set up interval to send keep-alive pings
      const interval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
        } catch (error) {
          console.log(`🔌 Client ${clientId} disconnected during ping, cleaning up`);
          clearInterval(interval);
          messageBroadcaster.removeClient(clientId);
        }
      }, 30000); // 30 second keep-alive

      // Store cleanup function for when client disconnects
      (controller as any).cleanup = () => {
        clearInterval(interval);
        messageBroadcaster.removeClient(clientId);
        console.log(`🔌 SSE client ${clientId} disconnected from task ${taskId}`);
      };
    },
    cancel() {
      // Cleanup when client disconnects
      if ((this as any).cleanup) {
        (this as any).cleanup();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}