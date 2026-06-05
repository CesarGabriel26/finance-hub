import { Component, forwardRef, signal, computed, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './icon-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IconPickerComponent),
      multi: true
    }
  ]
})
export class IconPickerComponent implements ControlValueAccessor {
  @Input() label: string = 'Selecionar Ícone';

  // Estados reativos
  value = signal<string>('account_balance');
  isOpen = signal<boolean>(false);
  disabled = signal<boolean>(false);
  searchTerm = signal<string>('');

  // Banco de dados de ícones selecionados (foco em finanças, gamificação e utilitários)
  iconDatabase = [
    'account_balance', 'credit_card', 'payments', 'wallet', 'trending_up', 'trending_down',
    'savings', 'monetization_on', 'paid', 'account_balance_wallet', 'receipt_long', 'analytics',
    'pie_chart', 'show_chart', 'bar_chart', 'finance', 'star', 'workspace_premium', 'military_tech',
    'emoji_events', 'trophy', 'school', 'local_fire_department', 'bolt', 'casino', 'sports_esports',
    'celebration', 'redeem', 'database', 'shield', 'key', 'lock', 'person', 'group', 'home',
    'store', 'shopping_cart', 'shopping_bag', 'work', 'construction', 'tools_wrench', 'settings',
    'notifications', 'mail', 'call', 'calendar_today', 'schedule', 'map', 'navigation'
  ];

  // Filtro computado em tempo real com base no que o usuário digita
  filteredIcons = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.iconDatabase;
    return this.iconDatabase.filter(icon => icon.toLowerCase().includes(search));
  });

  onChange: (value: string) => void = () => { };
  onTouched: () => void = () => { };

  toggle() {
    if (!this.disabled()) {
      this.isOpen.set(!this.isOpen());
      if (this.isOpen()) this.searchTerm.set(''); // Limpa a busca ao abrir
    }
  }

  selectIcon(icon: string) {
    this.value.set(icon);
    this.onChange(icon);
    this.isOpen.set(false);
  }

  writeValue(value: string): void {
    if (value) this.value.set(value);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}