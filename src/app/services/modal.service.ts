import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ComponentType } from "@angular/cdk/overlay";

export interface Modal {
  component: ComponentType<any>,
  data?: any
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // Lista privada que guarda os modais abertos
  private openedModals: Modal[] = [];

  // Subject que notifica o componente principal sobre as mudanças
  private modalsSubject = new BehaviorSubject<Modal[]>([]);
  modals$ = this.modalsSubject.asObservable();

  open(component: ComponentType<any>, data?: any): void {
    this.openedModals.push({ component, data });
    this.modalsSubject.next([...this.openedModals]);
  }

  close(): void {
    this.openedModals.pop();
    this.modalsSubject.next([...this.openedModals]);
  }

  closeAll(): void {
    this.openedModals = [];
    this.modalsSubject.next([]);
  }
}