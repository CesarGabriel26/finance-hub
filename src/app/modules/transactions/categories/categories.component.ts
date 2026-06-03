import { Component } from '@angular/core';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '../../../components/select/select.component';
import { DataFilter } from '../../../utils/data-filter';
import { CommonModule } from '@angular/common';

interface CategoryTableRow extends Record<string, unknown> {
  id?: string,
  name: string;
  icon: string;
  type: 'E' | 'I';
}

@Component({
  selector: 'app-categories',
  imports: [ContextMenuComponent, DataTableComponent, ReactiveFormsModule, SelectComponent,
    ContextMenuTriggerDirective,
    CommonModule,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class TransactionCategoriesComponent {
  filters = new FormGroup({
    filter: new FormControl<string>(''),
    type: new FormControl<string>('a'),
  })

  readonly menuItems: ContextMenuItem<CategoryTableRow>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (tx) => alert(`Visualizando detalhes de: ${tx.name}`),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: (tx) => alert(`Editando transação: ${tx.name}`),
    },
  ];

  readonly categories: CategoryTableRow[] = [
    {
      name: 'Alimentação',
      icon: 'fastfood',
      type: 'E',
    },
    {
      name: 'Transporte',
      icon: 'directions_car',
      type: 'E',
    },
    {
      name: 'Moradia',
      icon: 'home',
      type: 'E',
    },
    {
      name: 'Receitas',
      icon: 'account_balance_wallet',
      type: 'I',
    },
  ];

  readonly categoryColumns: DataTableColumn<CategoryTableRow>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'type', label: 'Tipo' },
  ];
  readonly categoryFilter: DataFilter<CategoryTableRow> | null = null;

  identifyCategory(row: CategoryTableRow): string {
    return row.id!;
  }
}
