import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para o AsyncPipe e NgComponentOutlet
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  // Injeção moderna do Angular
  protected modalService = inject(ModalService);

  // Pegamos a stream de modais do serviço
  modals$ = this.modalService.modals$;
}