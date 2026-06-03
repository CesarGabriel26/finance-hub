import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';

export interface DateRange {
  start: string | null;
  end: string | null;
}

@Component({
  selector: 'app-date-range-input',
  standalone: true,
  imports: [OverlayModule, CommonModule, ReactiveFormsModule],
  templateUrl: './date-range-input.component.html',
  styleUrl: './date-range-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangeInputComponent),
      multi: true
    }
  ]
})
export class DateRangeInputComponent implements ControlValueAccessor {

  isOpen = signal(false);

  range = new FormGroup({
    start: new FormControl<string>(''),
    end: new FormControl<string>(''),
  });

  onChange: (value: DateRange) => void = () => {};
  onTouched: () => void = () => {};

  get displayLabel(): string {
    const { start, end } = this.range.value;
    if (start && end) return `${this.formatDate(start)} → ${this.formatDate(end)}`;
    if (start) return `De ${this.formatDate(start)}`;
    return 'Selecionar período';
  }

  private formatDate(iso: string): string {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }

  toggleOverlay(): void {
    this.isOpen.update(v => !v);
    this.onTouched();
  }

  applyRange(): void {
    const { start, end } = this.range.value;
    this.onChange({ start: start ?? null, end: end ?? null });
    this.isOpen.set(false);
  }

  clearRange(): void {
    this.range.reset({ start: '', end: '' });
    this.onChange({ start: null, end: null });
    this.isOpen.set(false);
  }

  writeValue(value: DateRange | null): void {
    if (value) {
      this.range.setValue({ start: value.start ?? '', end: value.end ?? '' }, { emitEvent: false });
    } else {
      this.range.reset({ start: '', end: '' }, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
}
