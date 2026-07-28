import { BoardPreview } from "./board";


export interface User {
  name: string;
  boards: Array<BoardPreview>
}