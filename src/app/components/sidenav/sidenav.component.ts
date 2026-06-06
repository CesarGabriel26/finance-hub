import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface SimpleNavLink {
  label: string;
  icon: string;
  path: string;
  advanced?: boolean;
}

interface SimpleNavSection {
  label?: string;
  links: SimpleNavLink[];
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
})
export class SidenavComponent {
  readonly sections: SimpleNavSection[] = [
    {
      links: [
        { label: 'Resumo', icon: 'dashboard', path: '/main/dashboard' },
        { label: 'Contas', icon: 'account_balance', path: '/main/account/bank-accounts' },
        { label: 'Movimentos', icon: 'receipt_long', path: '/main/transactions/history' },
        { label: 'Importar extrato', icon: 'upload_file', path: '/main/transactions/statement-import' },
      ],
    },
    {
      label: 'Planejar',
      links: [
        { label: 'Agenda', icon: 'event', path: '/main/account/calendar' },
        { label: 'Orcamentos', icon: 'percent', path: '/main/budget/expense-budgets' },
        { label: 'Objetivos', icon: 'track_changes', path: '/main/budget/savings-targets' },
        { label: 'Investimentos', icon: 'monitoring', path: '/main/investments/dashboard' },
      ],
    },
    {
      label: 'Organizar',
      links: [
        { label: 'Categorias', icon: 'category', path: '/main/transactions/categories' },
        { label: 'Regras', icon: 'rule', path: '/main/transactions/category-rules', advanced: true },
        { label: 'Fechamento', icon: 'lock', path: '/main/budget/monthly-closing', advanced: true },
        { label: 'Conciliacao', icon: 'fact_check', path: '/main/account/reconciliation', advanced: true },
        { label: 'Configuracoes', icon: 'settings', path: '/main/settings/backup' },
      ],
    },
  ];
}
