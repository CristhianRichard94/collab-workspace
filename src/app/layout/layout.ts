import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user';

@Component({
  selector: 'app-layout',
  imports: [RouterLink],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  userService = inject(UserService)
  router: Router = inject(Router);


  logout() {
    this.userService.logout();
      this.router.navigate(["/"])

  }

}
