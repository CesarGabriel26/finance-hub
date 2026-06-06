import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidenavComponent } from "./components/sidenav/sidenav.component";
import { ModalComponent } from './components/modal/modal.component';
import { AppSettingsService } from './services/app-settings.service';
import { ModalService } from './services/modal.service';
import { NotificationsService } from './services/notifications.service';
import { TransactionFormComponent } from './modules/transactions/transaction-form/transaction-form.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, SidenavComponent, ModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('finance-hub');
  readonly monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  constructor(
    private notificationsService: NotificationsService,
    private appSettingsService: AppSettingsService,
    private modalService: ModalService,
  ) { }

  async ngOnInit(): Promise<void> {
    const settings = await this.appSettingsService.get();
    this.appSettingsService.apply(settings);

    if (settings.dueNotificationsEnabled) {
      void this.notificationsService.checkDue({ daysAhead: settings.dueNotificationDaysAhead });
    }
  }

  openNewTransaction(): void {
    this.modalService.open(TransactionFormComponent);
  }
}
