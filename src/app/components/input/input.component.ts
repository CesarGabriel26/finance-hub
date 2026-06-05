import { Component, forwardRef, Input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() id: string = `input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() type: string = 'text';
  @Input() prefix: string = ''; // Prefixo customizável (ex: 'R$', 'U$', 'Rpx')
  

  value = signal<any>('');
  displayValue = signal<string>(''); // Valor formatado exibido apenas visualmente no tipo currency
  disabled = signal<boolean>(false);

  onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: any): void {
    this.value.set(value ?? '');
    if (this.type === 'currency') {
      this.displayValue.set(this.formatCurrency(value));
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let rawValue = inputElement.value;

    if (this.type === 'currency') {
      // 1. Remove tudo que não for dígito
      const digits = rawValue.replace(/\D/g, '');

      // 2. Converte para número considerando os centavos (ex: 12 -> 0.12)
      const numericValue = digits ? parseFloat(digits) / 100 : 0;

      // 3. Atualiza os estados reativos
      this.value.set(numericValue);
      this.displayValue.set(this.formatCurrency(numericValue));

      // 4. Força o input a exibir a máscara atualizada
      inputElement.value = this.displayValue();

      // Envia o número puro (float) para o formulário pai
      this.onChange(numericValue);
    } else {
      this.value.set(rawValue);
      this.onChange(rawValue);
    }
  }

  // Auxiliar para transformar float em string de moeda nacional formatada
  private formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value || '0');
    if (isNaN(num)) return '0,00';

    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}