import { inject, Service, signal } from '@angular/core';
import { User } from '../types/user';
// import { toSignal } from '@angular/core/rxjs-interop';
import {HttpClient} from "@angular/common/http";
import {mockUser} from "./mock";

@Service()
export class UserService {
  http = inject(HttpClient);
  // private _currentUser = toSignal<User | null>(this.http.get<User>('/api/user'), { initialValue: null });
  private _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  login(username: string) {
    this._currentUser.set(mockUser);
    console.log(this.currentUser())
  }

  logout() {
    this._currentUser.set(null);
  }
}
