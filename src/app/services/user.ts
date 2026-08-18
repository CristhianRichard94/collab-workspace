import { inject, Service, signal } from '@angular/core';
import { AuthService } from './auth';
import { collection, docData, documentId, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { UserBoardPermission } from '../types/user';

@Service()
export class UserService {
  firestore = inject(Firestore);


  async getContributors(userList: Array<UserBoardPermission>) {
    const userCollection = collection(this.firestore, 'users')
    return await getDocs(query(userCollection, where(documentId(), 'in', userList.map(u => u.uid))))
  }
}
