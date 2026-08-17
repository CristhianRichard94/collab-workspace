import { BoardPreview } from "./board";


export interface User {
  uid: string;
  name: string;
  boards: Array<BoardPreview>
}

export interface UserBoardPermission {
  userId: string;
  role: UserBoardAccessType;
}

export enum UserBoardAccessType {
READ=3,
COMMENT=2,
WRITE=1,
ADMIN=0,
}