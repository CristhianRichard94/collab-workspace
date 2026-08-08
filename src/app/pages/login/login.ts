import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Layout } from '../../layout/layout';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [RouterLink, Layout, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private userService: UserService = inject(UserService);
  router: Router = inject(Router);


    username = signal<string>("");

    loginWithCreds() {
      this.userService.login(this.username())
      this.router.navigate(["/boards"])
    }

    loginWithGoogle() {
      this.router.navigate(["/boards"])
    }

}
