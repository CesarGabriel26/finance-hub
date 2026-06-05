import { Component, ElementRef, forwardRef, signal, ViewChild, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './color-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true
    }
  ]
})
export class ColorPickerComponent implements ControlValueAccessor {
  @ViewChild('saturationPanel') saturationPanel!: ElementRef<HTMLDivElement>;

  // Estados reativos (Signals)
  value = signal<string>('#00FF65');
  isOpen = signal<boolean>(false);
  disabled = signal<boolean>(false);

  // Valores HSV internos para controle do gráfico
  hue = signal<number>(144);        // Posição na barra colorida (0-360)
  saturation = signal<number>(100); // Eixo X da caixona (0-100)
  brightness = signal<number>(100); // Eixo Y da caixona (0-100)

  // Coordenadas dos ponteiros de seleção
  satPointerX = signal<number>(100);
  satPointerY = signal<number>(0);

  private isDraggingSat = false;
  private isDraggingHue = false;

  onChange: (value: string) => void = () => { };
  onTouched: () => void = () => { };

  toggle() {
    if (!this.disabled()) this.isOpen.set(!this.isOpen());
  }

  writeValue(value: string): void {
    if (value) {
      this.value.set(value);
      this.parseHexToHsv(value);
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  // --- Lógica de Interação e Arraste ---

  startSatDrag(event: MouseEvent) {
    this.isDraggingSat = true;
    this.handleSatMove(event);
  }

  startHueDrag(event: MouseEvent) {
    this.isDraggingHue = true;
    this.handleHueMove(event);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDraggingSat) this.handleSatMove(event);
    if (this.isDraggingHue) this.handleHueMove(event);
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDraggingSat = false;
    this.isDraggingHue = false;
  }

  private handleSatMove(event: MouseEvent) {
    if (!this.saturationPanel) return;
    const rect = this.saturationPanel.nativeElement.getBoundingClientRect();

    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    this.satPointerX.set(x);
    this.satPointerY.set(y);

    this.saturation.set(x);
    this.brightness.set(100 - y);
    this.updateHex();
  }

  private handleHueMove(event: MouseEvent) {
    const slider = event.currentTarget as HTMLDivElement;

    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    x = Math.max(0, Math.min(100, x));

    this.hue.set(Math.round((x / 100) * 360));
    this.updateHex();
  }

  // --- Conversores Matemáticos (HEX / HSV) ---

  private updateHex() {
    const hex = this.hsvToHex(this.hue(), this.saturation(), this.brightness());
    this.value.set(hex);
    this.onChange(hex);
  }

  private hsvToHex(h: number, s: number, v: number): string {
    s /= 100; v /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => v * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

    const r = Math.round(255 * f(5));
    const g = Math.round(255 * f(3));
    const b = Math.round(255 * f(1));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  private parseHexToHsv(hex: string) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    this.hue.set(Math.round(h * 360));
    this.saturation.set(Math.round(s * 100));
    this.brightness.set(Math.round(v * 100));

    this.satPointerX.set(this.saturation());
    this.satPointerY.set(100 - this.brightness());
  }

  generateRandomColor() {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    this.writeValue(randomHex);
    this.onChange(randomHex);
  }
}