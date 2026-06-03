import { Component, Input, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay'; // 👈 Importante

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [OverlayModule], // 👈 Adicione aqui
  templateUrl: './select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Selecione...';

  isOpen = signal(false);
  selectedValue = signal<any>(null);

  onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  toggleDropdown(): void {
    this.isOpen.update(val => !val);
    this.onTouched();
  }

  selectOption(option: SelectOption): void {
    this.selectedValue.set(option.value);
    this.isOpen.set(false);
    this.onChange(option.value);
  }

  get selectedLabel(): string {
    const matched = this.options.find(opt => opt.value === this.selectedValue());
    return matched ? matched.label : this.placeholder;
  }

  writeValue(value: any): void { this.selectedValue.set(value); }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
}
