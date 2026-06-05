import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryType, NewCategory } from '../../../models';
import { ColorPickerComponent } from '../../../components/color-picker/color-picker.component';
import { IconPickerComponent } from '../../../components/icon-picker/icon-picker.component';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent } from '../../../components/select/select.component';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ColorPickerComponent,
    IconPickerComponent,
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css',
})
export class CategoryFormComponent implements OnInit {
  @Input() category?: Category;

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    type: new FormControl<CategoryType>('expense', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    color: new FormControl<string>('#3B82F6', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    icon: new FormControl<string>('payments', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private categoryService: CategoriesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    if (!this.category) return;

    this.form.patchValue({
      name: this.category.name,
      type: this.category.type,
      color: this.category.color ?? '#3B82F6',
      icon: this.category.icon ?? 'payments',
    });
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewCategory = {
      name: raw.name.trim(),
      type: raw.type,
      color: raw.color,
      icon: raw.icon,
      parentId: this.category?.parentId ?? null,
    };

    const save = this.category?.id
      ? this.categoryService.update(this.category.id, payload)
      : this.categoryService.insert(payload);

    save.then(() => {
      this.categoryService.updated.emit();
      this.modalService.close();
    });
  }
}
