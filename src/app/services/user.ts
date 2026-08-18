import { inject, Service } from '@angular/core';
import { collection, documentId, Firestore, getDocs, query, QuerySnapshot, where } from '@angular/fire/firestore';
import { UserBoardAccessType } from '../types/user';

@Service()
export class UserService {
  firestore = inject(Firestore);

  async getContributors(contributors: Record<string, UserBoardAccessType>): Promise<QuerySnapshot> {
    const uids = Object.keys(contributors ?? {});
    if (uids.length === 0) {
      // `where(documentId(), 'in', [])` is invalid in Firestore (needs 1-10
      // items), so short-circuit without hitting Firestore at all.
      return { forEach: () => {} } as unknown as QuerySnapshot;
    }

    // `where(documentId(), 'in', uids)` caps at 10 values, but boards can
    // now have more than 10 contributors via self-serve join, so chunk into
    // groups of <=10 and merge the results.
    const userCollection = collection(this.firestore, 'users');
    const chunks: string[][] = [];
    for (let i = 0; i < uids.length; i += 10) {
      chunks.push(uids.slice(i, i + 10));
    }

    const snapshots = await Promise.all(
      chunks.map((chunk) => getDocs(query(userCollection, where(documentId(), 'in', chunk)))),
    );

    return {
      forEach: (callback: Parameters<QuerySnapshot['forEach']>[0]) => {
        snapshots.forEach((snapshot) => snapshot.forEach(callback));
      },
    } as unknown as QuerySnapshot;
  }
}
