import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, user } from '@angular/fire/auth';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  route: ActivatedRoute = inject(ActivatedRoute);
  auth = inject(Auth);
  platformId = inject(PLATFORM_ID)

  private get redirectTo(): string {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    return redirectTo || '/boards';
  }

  ngOnInit() {
     if (isPlatformBrowser(this.platformId)) {
      user(this.auth)
        .pipe(first())
        .subscribe((currentUser) => {
          if (currentUser) {

            this.router.navigateByUrl(this.redirectTo);
          }
        });
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(this.auth, provider);

      this.router.navigateByUrl(this.redirectTo);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }
}
