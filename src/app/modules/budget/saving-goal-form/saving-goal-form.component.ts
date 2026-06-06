import { Component, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account, NewSavingGoal, SavingGoal, SavingGoalStatus } from '../../../models';
import { ColorPickerComponent } from '../../../components/color-picker/color-picker.component';
import { IconPickerComponent } from '../../../components/icon-picker/icon-picker.component';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { AccountsService } from '../../../services/accounts.service';
import { ModalService } from '../../../services/modal.service';
import { SavingGoalsService } from '../../../services/saving-goals.service';
import { buildSavingGoalPayload } from './saving-goal-form.utils';

@Component({
  selector: 'app-saving-goal-form',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ColorPickerComponent,
    IconPickerComponent,
  ],
  templateUrl: './saving-goal-form.component.html',
  styleUrl: './saving-goal-form.component.css',
})
export class SavingGoalFormComponent implements OnInit {
  @Input() goal?: SavingGoal;

  accountOptions = signal<SelectOption[]>([{ value: '', label: 'Sem conta vinculada' }]);

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    targetAmount: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    currentAmount: new FormControl<number>(0, { nonNullable: true }),
    targetDate: new FormControl<string>('', { nonNullable: true }),
    accountId: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<SavingGoalStatus>('active', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    color: new FormControl<string>('#10B981', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    icon: new FormControl<string>('savings', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private accountsService: AccountsService,
    private goalsService: SavingGoalsService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.accountsService.getAll().then((accounts: Account[]) => {
      this.accountOptions.set([
        { value: '', label: 'Sem conta vinculada' },
        ...accounts.map(account => ({
          value: account.id,
          label: account.name,
          icon: account.icon ?? undefined,
        })),
      ]);
    });

    if (this.goal) {
      this.form.patchValue({
        name: this.goal.name,
        description: this.goal.description ?? '',
        targetAmount: this.goal.targetAmount,
        currentAmount: this.goal.currentAmount,
        targetDate: this.goal.targetDate ?? '',
        accountId: this.goal.accountId ?? '',
        status: this.goal.status,
        color: this.goal.color ?? '#10B981',
        icon: this.goal.icon ?? 'savings',
      });
    }
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewSavingGoal = buildSavingGoalPayload(raw);

    const save = this.goal?.id
      ? this.goalsService.update(this.goal.id, payload)
      : this.goalsService.insert(payload);

    save.then(() => {
      this.goalsService.updated.emit();
      this.modalService.close();
    });
  }
}
