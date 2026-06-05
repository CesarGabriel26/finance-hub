import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent } from '../../../components/select/select.component';
import { Category } from '../../../models';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-categories',
  imports: [
    CommonModule,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    DataTableComponent,
    InputComponent,
    ReactiveFormsModule,
    SelectComponent,
  ],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css',
})
export class CategoriesListComponent implements OnInit {
  filters = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    type: new FormControl<string>('', { nonNullable: true }),
  });

  readonly menuItems: ContextMenuItem<Category>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: category => this.openModal(category),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: category => this.delete(category),
    },
  ];

  categories = signal<Category[]>([]);

  readonly categoryColumns: DataTableColumn<Category>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'type', label: 'Tipo' },
    { key: 'isFixed', label: 'Recorrencia' },
  ];

  constructor(
    private categoryService: CategoriesService,
    private modalService: ModalService,
  ) {}

  identifyCategory(row: Category): string {
    return row.id;
  }

  openModal(category?: Category): void {
    this.modalService.open(CategoryFormComponent, { category });
  }

  ngOnInit(): void {
    this.search();

    this.categoryService.updated.subscribe(() => this.search());

    this.filters.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
      )
      .subscribe(() => this.search());
  }

  search(): void {
    let payload: any = {};

    if (this.filters.value.name) {
      payload = {
        name: {
          like: this.filters.value.name,
        },
      };
    }

    if (this.filters.value.type !== '') {
      payload = {
        ...payload,
        type: {
          eq: this.filters.value.type,
        },
      };
    }

    const filters = Object.keys(payload).length > 0 ? payload : undefined;

    this.categoryService.getAll(filters).then(response => {
      this.categories.set(response);
    });
  }

  delete(category: Category): void {
    this.categoryService.delete(category.id).then(() => {
      this.categoryService.updated.emit();
    });
  }
}
