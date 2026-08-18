import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID, resource, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, User as FirebaseUser, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { User as AppUser } from '../types/user';

@Service()
export class AuthService {
  http = inject(HttpClient);
  auth = inject(Auth);
  platformId = inject(PLATFORM_ID);
  firestore = inject(Firestore)

  uid = computed(() => this.firebaseUser()?.uid ?? null);
  private firebaseUser = toSignal<FirebaseUser | null>(
    isPlatformBrowser(this.platformId) ? user(this.auth) : of(null)
  );

  /**
   * True once the Firebase auth state has emitted at least once (either a
   * user or `null`). Consumers such as `authGuard` must wait for this to be
   * true before making an authenticated/unauthenticated decision, otherwise
   * a legitimate session can be wrongly rejected while it is still
   * restoring (e.g. right after a page refresh).
   */
  authReady = computed(() => this.firebaseUser() !== undefined);


  user$ = resource<AppUser|undefined, string | null>({
    params: () => this.uid(),
    loader: async ({params: uid}) => {
      if (!uid) return undefined
      const userRef = doc(this.firestore, `users/${uid}`);
      return await new Promise<AppUser|undefined>(resolve => {
        docData(userRef, {idField: 'uid'}).subscribe((data) => resolve(data as AppUser| undefined))
      })
    }
  })
  currentUser =  this.user$.value;


  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    await this.ensureUserDoc(result.user);
    return result.user;
  }

  logout() {
    return signOut(this.auth);
  }

  async ensureUserDoc(firebaseUser: FirebaseUser) {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    await setDoc(
      userRef,
      {
        name: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        boards: []
      },
      {merge: true}
    )
  }


}
