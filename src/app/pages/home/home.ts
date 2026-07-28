import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Layout } from '../../components/layout/layout';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Layout],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
}
