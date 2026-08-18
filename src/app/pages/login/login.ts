import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, user } from '@angular/fire/auth';
import { Router, RouterLink } from '@angular/router';
import { Layout } from '../../layout/layout';
import {first} from 'rxjs'
@Component({
  selector: 'app-login',
  imports: [RouterLink, Layout],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  router: Router = inject(Router);
  auth = inject(Auth);
  platformId = inject(PLATFORM_ID)

  ngOnInit() {
     if (isPlatformBrowser(this.platformId)) {
      user(this.auth)
        .pipe(first())
        .subscribe((currentUser) => {
          if (currentUser) {

            this.router.navigate(['/boards']);
          }
        });
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(this.auth, provider);

      this.router.navigate(['/boards']);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }
}
