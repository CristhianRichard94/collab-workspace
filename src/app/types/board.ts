import { User } from "./user";

export interface Board extends BoardPreview {
  columns: Array<TaskColumn>
}

export interface BoardPreview {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  createdAt: Date;
  assignedTo:User;
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
index: number;
tasks: Array<Task>
}

export const DefaultColumns: Array<TaskColumn> = [
  {id: "0", index: 0, name: 'Todo', tasks:[]},
  {id: "1", index: 1, name: 'In progress', tasks:[]},
  {id: "2", index: 2, name: 'Review', tasks:[]},
  {id: "3", index: 3, name: 'Done', tasks:[]},
]
