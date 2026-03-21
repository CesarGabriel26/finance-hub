import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { UpdateModalComponent } from './components/update-modal/update-modal.component';
import { UpdateService } from './services/update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, UpdateModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('finance-hub');
  private updateService = inject(UpdateService);

  ngOnInit() {
    // Automatically check for updates on startup
    setTimeout(() => {
      this.updateService.checkForUpdates();
    }, 3000); // 3 seconds delay to avoid startup lag
  }
}
