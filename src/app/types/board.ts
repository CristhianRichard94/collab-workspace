import { User, UserBoardPermission } from "./user";

export interface Board extends BoardPreview {
  columns: Array<TaskColumn>
  contributors: Array<UserBoardPermission>
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
// index: number;
tasks: Array<Task>
}

export const DefaultColumns: Array<TaskColumn> = [
  {id: "0", name: 'Todo', tasks:[]},
  {id: "1", name: 'In progress', tasks:[]},
  {id: "2", name: 'Review', tasks:[]},
  {id: "3", name: 'Done', tasks:[]},
]
