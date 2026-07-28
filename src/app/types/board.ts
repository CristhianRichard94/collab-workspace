export interface Board extends BoardPreview {
  cards: Array<Card>;
}

export interface BoardPreview {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
}


export interface Card {
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
