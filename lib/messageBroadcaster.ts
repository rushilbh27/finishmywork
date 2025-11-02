// In-memory message broadcasting for SSE
class MessageBroadcaster {
  private clients: Map<string, { controller: ReadableStreamDefaultController; taskId: string }> = new Map();

  addClient(clientId: string, controller: ReadableStreamDefaultController, taskId: string) {
    this.clients.set(clientId, { controller, taskId });
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
  }

  broadcast(taskId: string, data: any) {
    console.log(`📡 Broadcasting to task ${taskId}:`, data);
    
    const clientsToRemove: string[] = [];
    
    this.clients.forEach((client, clientId) => {
      if (client.taskId === taskId) {
        try {
          const message = JSON.stringify(data);
          client.controller.enqueue(`data: ${message}\n\n`);
          console.log(`✅ Message sent to client ${clientId}`);
        } catch (error) {
          console.log(`❌ Client ${clientId} disconnected, removing from broadcast list`);
          clientsToRemove.push(clientId);
        }
      }
    });
    
    // Remove disconnected clients
    clientsToRemove.forEach(clientId => this.removeClient(clientId));
  }
}

export const messageBroadcaster = new MessageBroadcaster();