import { Component, Input, ViewChild, TemplateRef, Directive, HostListener, inject, ViewContainerRef, ElementRef, Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { fromEvent, Subscription } from 'rxjs';

export interface ContextMenuItem<T = any> {
  label?: string;
  icon?: string;
  onClick?: (item: T) => void;
  isDisabled?: (item: T) => boolean;
  isVisible?: (item: T) => boolean;
  isSeparator?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContextMenuService {
  private activeOverlay: OverlayRef | null = null;
  private documentEventsSub?: Subscription;

  register(overlayRef: OverlayRef): void {
    this.closeActive();
    this.activeOverlay = overlayRef;

    // Fechar ao clicar ou dar botão direito em qualquer área que não propague o evento
    this.documentEventsSub = fromEvent<MouseEvent>(document, 'click')
      .subscribe(() => this.closeActive());

    this.documentEventsSub.add(
      fromEvent<MouseEvent>(document, 'contextmenu')
        .subscribe(() => this.closeActive())
    );

    this.documentEventsSub.add(
      fromEvent(window, 'resize').subscribe(() => this.closeActive())
    );
  }

  closeActive(): void {
    if (this.activeOverlay) {
      this.activeOverlay.dispose();
      this.activeOverlay = null;
    }
    if (this.documentEventsSub) {
      this.documentEventsSub.unsubscribe();
      this.documentEventsSub = undefined;
    }
  }
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css'
})
export class ContextMenuComponent {
  @Input() items: ContextMenuItem[] = [];

  @ViewChild(TemplateRef) menuTemplate!: TemplateRef<any>;
}

@Directive({
  selector: '[appContextMenuTriggerFor]',
  standalone: true
})
export class ContextMenuTriggerDirective {
  @Input('appContextMenuTriggerFor') menu!: ContextMenuComponent;
  @Input('appContextMenuData') data: any;
  @Input('appContextMenuTriggerType') triggerType: 'contextmenu' | 'click' | 'both' = 'contextmenu';

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);
  private menuService = inject(ContextMenuService);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.triggerType === 'click' || this.triggerType === 'both') {
      event.stopPropagation();
      event.preventDefault();
      this.open(event, true);
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (this.triggerType === 'contextmenu' || this.triggerType === 'both') {
      event.stopPropagation();
      event.preventDefault();
      this.open(event, false);
    }
  }

  private open(event: MouseEvent, relativeToElement: boolean): void {
    this.menuService.closeActive();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(relativeToElement ? this.elementRef.nativeElement : { x: event.clientX, y: event.clientY })
      .withPositions(relativeToElement ? [
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 4
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetY: -4
        }
      ] : [
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 2,
          offsetY: 2
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetX: 2,
          offsetY: -2
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetX: -2,
          offsetY: 2
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetX: -2,
          offsetY: -2
        }
      ]);

    const overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    const portal = new TemplatePortal(this.menu.menuTemplate, this.viewContainerRef, {
      $implicit: this.data,
      close: () => this.menuService.closeActive()
    });

    overlayRef.attach(portal);
    this.menuService.register(overlayRef);
  }
}
