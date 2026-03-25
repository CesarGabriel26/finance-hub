import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { UpdateService } from './services/update.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, UpdateModalComponent, DialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('finance-hub');
  private updateService = inject(UpdateService);
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Automatically check for updates on startup
    setTimeout(() => {
      this.updateService.checkForUpdates();
    }, 3000); // 3 seconds delay to avoid startup lag
  }
}
