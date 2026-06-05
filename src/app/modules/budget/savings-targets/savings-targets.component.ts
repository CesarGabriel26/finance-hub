import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { Account, SavingGoal } from '../../../models';
import { AccountsService } from '../../../services/accounts.service';
import { ModalService } from '../../../services/modal.service';
import { SavingGoalsService } from '../../../services/saving-goals.service';
import { SavingGoalFormComponent } from '../saving-goal-form/saving-goal-form.component';

@Component({
  selector: 'app-savings-targets.component',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
  ],
  templateUrl: './savings-targets.component.html',
  styleUrl: './savings-targets.component.css',
})
export class SavingsTargetsComponent implements OnInit {
  goals = signal<SavingGoal[]>([]);
  accounts = signal<Account[]>([]);

  readonly menuItems: ContextMenuItem<SavingGoal>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: goal => this.openModal(goal),
    },
    {
      label: 'Marcar concluida',
      icon: 'check_circle',
      isVisible: goal => goal.status !== 'completed',
      onClick: goal => this.markCompleted(goal),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: goal => this.delete(goal),
    },
  ];

  constructor(
    private goalsService: SavingGoalsService,
    private accountsService: AccountsService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadAccounts();
    this.goalsService.updated.subscribe(() => this.load());
  }

  openModal(goal?: SavingGoal): void {
    this.modalService.open(SavingGoalFormComponent, { goal });
  }

  load(): void {
    this.goalsService.getAll().then(goals => this.goals.set(goals));
  }

  markCompleted(goal: SavingGoal): void {
    this.goalsService
      .update(goal.id, { status: 'completed', currentAmount: goal.targetAmount })
      .then(() => this.goalsService.updated.emit());
  }

  delete(goal: SavingGoal): void {
    this.goalsService.delete(goal.id).then(() => {
      this.goalsService.updated.emit();
    });
  }

  progress(goal: SavingGoal): number {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }

  remaining(goal: SavingGoal): number {
    return Math.max(0, goal.targetAmount - goal.currentAmount);
  }

  getAccountName(goal: SavingGoal): string {
    return this.accounts().find(account => account.id === goal.accountId)?.name ?? 'Sem conta';
  }

  statusLabel(goal: SavingGoal): string {
    const labels: Record<SavingGoal['status'], string> = {
      active: 'Ativa',
      completed: 'Concluida',
      paused: 'Pausada',
    };

    return labels[goal.status];
  }

  statusClass(goal: SavingGoal): string {
    const classes: Record<SavingGoal['status'], string> = {
      active: 'bg-emerald-500/10 text-emerald-700',
      completed: 'bg-blue-500/10 text-blue-700',
      paused: 'bg-amber-500/10 text-amber-700',
    };

    return classes[goal.status];
  }

  private loadAccounts(): void {
    this.accountsService.getAll().then(accounts => this.accounts.set(accounts));
  }
}
