import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ComponentType } from "@angular/cdk/overlay";

export interface Modal {
  id: number,
  component: ComponentType<any>,
  data?: any,
  resolve?: (value: unknown) => void,
}

export interface ModalRef<T = unknown> {
  closed: Promise<T | undefined>;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // Lista privada que guarda os modais abertos
  private openedModals: Modal[] = [];
  private nextId = 1;

  // Subject que notifica o componente principal sobre as mudanças
  private modalsSubject = new BehaviorSubject<Modal[]>([]);
  modals$ = this.modalsSubject.asObservable();

  open<T = unknown>(component: ComponentType<any>, data?: any): ModalRef<T> {
    let resolveRef!: (value: T | undefined) => void;
    const closed = new Promise<T | undefined>(resolve => {
      resolveRef = resolve;
    });

    this.openedModals.push({
      id: this.nextId++,
      component,
      data,
      resolve: resolveRef as (value: unknown) => void,
    });
    this.modalsSubject.next([...this.openedModals]);

    return { closed };
  }

  close(result?: unknown): void {
    const modal = this.openedModals.pop();
    modal?.resolve?.(result);
    this.modalsSubject.next([...this.openedModals]);
  }

  closeAll(): void {
    this.openedModals.forEach(modal => modal.resolve?.(undefined));
    this.openedModals = [];
    this.modalsSubject.next([]);
  }
}
