import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountsService } from '../../services/accounts.service';
import { AccountsPayableService } from '../../services/accounts-payable.service';
import { AccountsReceivableService } from '../../services/accounts-receivable.service';
import { BudgetsService } from '../../services/budgets.service';
import { InvestmentPortfoliosService } from '../../services/investment-portfolios.service';
import { TransactionsService } from '../../services/transactions.service';

interface OnboardingStep {
  label: string;
  icon: string;
  description: string;
  route: string;
  done: boolean;
}

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, RouterLink],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent implements OnInit {
  steps = signal<OnboardingStep[]>([]);

  constructor(
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
    private payablesService: AccountsPayableService,
    private receivablesService: AccountsReceivableService,
    private budgetsService: BudgetsService,
    private portfolioService: InvestmentPortfoliosService,
  ) {}

  ngOnInit(): void {
    const today = new Date();
    Promise.all([
      this.accountsService.getAll(),
      this.transactionsService.getAll(),
      this.payablesService.getAll(),
      this.receivablesService.getAll(),
      this.budgetsService.getAll(today.getMonth() + 1, today.getFullYear()),
      this.portfolioService.getAll(),
    ]).then(([accounts, transactions, payables, receivables, budgets, portfolios]) => {
      this.steps.set([
        {
          label: 'Criar primeira conta',
          icon: 'account_balance',
          description: 'Base para importar extratos e acompanhar saldo.',
          route: '/main/account/bank-accounts',
          done: accounts.length > 0,
        },
        {
          label: 'Importar ou lancar transacoes',
          icon: 'upload_file',
          description: 'Monte o historico financeiro sem preencher tudo manualmente.',
          route: '/main/transactions/statement-import',
          done: transactions.length > 0,
        },
        {
          label: 'Organizar vencimentos',
          icon: 'event',
          description: 'Cadastre contas fixas, parcelas e recebimentos.',
          route: '/main/account/calendar',
          done: payables.length + receivables.length > 0,
        },
        {
          label: 'Definir metas por categoria',
          icon: 'flag',
          description: 'Controle limites de gastos ou metas minimas de aporte.',
          route: '/main/budget/expense-budgets',
          done: budgets.length > 0,
        },
        {
          label: 'Cadastrar investimentos',
          icon: 'query_stats',
          description: 'Acompanhe renda fixa, patrimonio e historico.',
          route: '/main/investments/dashboard',
          done: portfolios.length > 0,
        },
      ]);
    });
  }

  completedCount(): number {
    return this.steps().filter(step => step.done).length;
  }
}
