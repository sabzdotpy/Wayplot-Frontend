import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignIn } from './sign-in/sign-in';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,SignIn],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('WayPlot');
}
