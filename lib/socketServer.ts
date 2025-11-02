import { Server as ServerIO } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import createClient from "ioredis";

// Prevent hot-reload duplication in dev mode
if (process.env.NODE_ENV !== "production" && globalThis.io) {
  console.log("⚙️ Reusing existing Socket.IO instance");
}

declare global {
  // eslint-disable-next-line no-var
  var io: ServerIO | undefined;
}

export async function ensureSocketIO(): Promise<ServerIO> {
  if (!globalThis.io) {
    const io = new ServerIO({
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
      },
    });

    if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
      try {
  const pubClient = new createClient(process.env.REDIS_URL as any);
  const subClient = new createClient(process.env.REDIS_URL as any);
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
        console.log("🚀 Socket.IO Redis adapter initialized");
      } catch (error) {
        console.error("❌ Redis adapter connection failed:", error);
      }
    }

    io.on("connection", (socket) => {
      console.log("🟢 User connected:", socket.id);

      socket.on("join-user", (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`👤 ${socket.id} joined user-${userId}`);
      });

      socket.on("join-task", (taskId: string | number) => {
        const room = `task-${taskId}`;
        socket.join(room);
        console.log(`🟢 ${socket.id} joined ${room}`);
      });

      socket.on("leave-task", (taskId: string | number) => {
        const room = `task-${taskId}`;
        socket.leave(room);
        console.log(`🚪 ${socket.id} left ${room}`);
      });

      socket.on("typing-start", (data: { taskId: string; userId: string }) => {
        socket.to(`task-${data.taskId}`).emit("user-typing", {
          userId: data.userId,
          isTyping: true,
        });
      });

      socket.on("typing-stop", (data: { taskId: string; userId: string }) => {
        socket.to(`task-${data.taskId}`).emit("user-typing", {
          userId: data.userId,
          isTyping: false,
        });
      });

      socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
      });
    });

    globalThis.io = io;
    console.log("🔥 Socket.IO server initialized");
  }

  return globalThis.io!;
}

export function getSocketIO(): ServerIO | undefined {
  return globalThis.io;
}

export function broadcastMessage(taskId: number | string, message: unknown) {
  const io = getSocketIO();
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized, cannot broadcast");
    return;
  }

  const room = `task-${taskId}`;
  io.to(room).emit("message:created", message);
  console.log(`📡 Broadcasted message to task-${taskId}`);
}

function broadcastEvent(eventName: string, payload: unknown, room?: string) {
  const io = getSocketIO();
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized, cannot broadcast");
    return;
  }

  if (room) {
    io.to(room).emit(eventName, payload);
    console.log(`📡 Broadcasted: ${eventName} → ${room}`);
  } else {
    io.emit(eventName, payload);
    console.log(`📡 Broadcasted: ${eventName}`);
  }
}

export const emitTaskCreated = (task: unknown) =>
  broadcastEvent("task:created", { task });
export const emitTaskUpdated = (task: unknown) =>
  broadcastEvent("task:updated", { task });
export const emitTaskDeleted = (taskId: number | string) =>
  broadcastEvent("task:deleted", { taskId });

// Notification events
export function emitNotification(userId: number | string, notification: unknown) {
  const io = getSocketIO();
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized, cannot emit notification");
    return;
  }

  const userRoom = `user:${userId}`;
  io.to(userRoom).emit("notification:created", notification);
  console.log(`🔔 Notification sent to user-${userId}`);
}

process.on("SIGTERM", () => {
  if (globalThis.io) {
    console.log("🧹 Shutting down Socket.IO...");
    globalThis.io.close();
  }
});
