export interface User {
  id: number;
  name: string;
  avatar?: string;
}

export interface Task {
  id: number;
  title: string;
  posterId: number;
  accepterId: number;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface Message {
  id: number;
  taskId: number;
  content: string;
  createdAt: string;
  senderId: number;
  receiverId: number;
  sender?: User;
}
