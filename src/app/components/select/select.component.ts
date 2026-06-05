import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [OverlayModule, CommonModule],
  templateUrl: './select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Selecione...';
  @Input() searchable: boolean = false;
  @Input() searchPlaceholder: string = 'Buscar...';
  @Input() emptyMessage: string = 'Nenhuma opcao encontrada.';

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  isOpen = signal(false);
  selectedValue = signal<any>(null);
  searchTerm = signal('');

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
      return;
    }

    this.searchTerm.set('');
    this.isOpen.set(true);
    this.onTouched();

    if (this.searchable) {
      setTimeout(() => this.searchInput?.nativeElement.focus());
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  selectOption(option: SelectOption): void {
    this.selectedValue.set(option.value);
    this.closeDropdown();
    this.onChange(option.value);
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  filteredOptions(): SelectOption[] {
    const search = this.normalizeLabel(this.searchTerm());

    if (!this.searchable || !search) {
      return this.options;
    }

    return this.options.filter(option => this.normalizeLabel(option.label).includes(search));
  }

  get selectedLabel(): string {
    const matched = this.options.find(opt => opt.value === this.selectedValue());
    return matched ? matched.label : this.placeholder;
  }

  private normalizeLabel(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  writeValue(value: any): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
