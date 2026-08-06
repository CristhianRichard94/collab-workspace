export interface Board extends BoardPreview {
  tasks: Array<Task>;
}

export interface BoardPreview {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
}


export interface Task {
  title: string;
  description: string;
  state: TaskState;
}

export enum TaskState {
  Todo = 'Todo',
  InProgress = 'InProgress',
  Review = 'Review',
  Done = 'Done',
}
