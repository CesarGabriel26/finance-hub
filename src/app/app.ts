import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from "./components/sidenav/sidenav.component";
import { ModalComponent } from './components/modal/modal.component';
import { NotificationsService } from './services/notifications.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidenavComponent, ModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('finance-hub');

  constructor(
    private notificationsService: NotificationsService
  ) { }

  ngOnInit(): void {
    void this.notificationsService.checkDue({ daysAhead: 3 });
  }
}
