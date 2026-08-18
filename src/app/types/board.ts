import { User, UserBoardAccessType } from "./user";

export interface Board extends BoardPreview {
  columns: Array<TaskColumn>
  contributors: Record<string, UserBoardAccessType>
}

export interface BoardPreview {
  id: string;
  title: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  createdAt: Date;
  assignedTo?: User;
  comments: Array<Comment>;
}

export interface Comment {
  text: string;
  createdAt: string;
  user: string;
}
export interface TaskColumn {
id: string;
name: string;
description?: string;
// index: number;
tasks: Array<Task>
}
