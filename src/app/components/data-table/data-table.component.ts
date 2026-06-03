import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  TemplateRef,
} from '@angular/core';
import { DataFilter, filterRows, getValueByPath } from '../../utils/data-filter';

export type DataTableAlign = 'left' | 'center' | 'right';

export interface DataTableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  align?: DataTableAlign;
  width?: string;
  className?: string;
  formatter?: (value: unknown, row: T, index: number) => string | number | null | undefined;
}

export interface DataTableRowContext<T extends Record<string, unknown> = Record<string, unknown>> {
  $implicit: T;
  row: T;
  index: number;
  columns: readonly DataTableColumn<T>[];
}

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  @Input() rows: readonly T[] = [];
  @Input() columns: readonly DataTableColumn<T>[] = [];
  @Input() filter?: DataFilter<T> | null;
  @Input() title = '';
  @Input() description = '';
  @Input() compact = false;
  @Input() loading = false;
  @Input() emptyMessage = 'Nenhum registro encontrado.';
  @Input() loadingMessage = 'Carregando registros...';
  @Input() getRowId: (row: T, index: number) => string | number = (_row, index) => index;

  @ContentChild('dataTableRow', { read: TemplateRef })
  dataTableRow?: TemplateRef<DataTableRowContext<T>>;

  @ContentChild('dataTableActions', { read: TemplateRef })
  dataTableActions?: TemplateRef<unknown>;

  get filteredRows(): readonly T[] {
    return filterRows(this.rows, this.filter);
  }

  get hasHeader(): boolean {
    return Boolean(this.title || this.description || this.dataTableActions);
  }

  resolveColumns(rows: readonly T[]): readonly DataTableColumn<T>[] {
    if (this.columns.length > 0) {
      return this.columns;
    }

    const firstRow = rows[0];

    if (!firstRow) {
      return [];
    }

    return Object.keys(firstRow).map((key) => ({
      key,
      label: this.humanizeColumnName(key),
    }));
  }

  rowContext(row: T, index: number): DataTableRowContext<T> {
    return {
      $implicit: row,
      row,
      index,
      columns: this.columns,
    };
  }

  trackRow(index: number, row: T): string | number {
    return this.getRowId(row, index);
  }

  cellValue(row: T, column: DataTableColumn<T>, index: number): string {
    const value = getValueByPath(row, String(column.key));
    const formattedValue = column.formatter ? column.formatter(value, row, index) : value;

    if (formattedValue === undefined || formattedValue === null || formattedValue === '') {
      return '-';
    }

    return String(formattedValue);
  }

  headerCellClass(column: DataTableColumn<T>): string {
    return this.cellClass('data-table-heading', column);
  }

  bodyCellClass(column: DataTableColumn<T>): string {
    return this.cellClass('data-table-cell', column);
  }

  private cellClass(baseClass: string, column: DataTableColumn<T>): string {
    const alignClass = `${baseClass}--${column.align ?? 'left'}`;

    return [baseClass, alignClass, column.className].filter(Boolean).join(' ');
  }

  private humanizeColumnName(key: string): string {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (letter) => letter.toLocaleUpperCase('pt-BR'));
  }
}
