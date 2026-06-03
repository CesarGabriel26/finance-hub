import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from "./components/sidenav/sidenav.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidenavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('finance-hub');
}
