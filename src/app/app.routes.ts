import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { InvestmentsDashboardComponent } from './modules/investments/investments-dashboard/investments-dashboard.component';
import { TransactionsHistoryComponent } from './modules/transactions/history/history.component';
import { StatementImportComponent } from './modules/transactions/statement-import/statement-import.component';
import { SavingsTargetsComponent } from './modules/budget/savings-targets/savings-targets.component';
import { ExpenseBudgetsComponent } from './modules/budget/expense-budgets/expense-budgets.component';
import { CategoriesListComponent } from './modules/categories/categories-list/categories-list.component';
import { CategoryRulesComponent } from './modules/categories/category-rules/category-rules.component';
import { AccountsReceivableComponent } from './modules/accounts/receivable/accounts-receivable/accounts-receivable.component';
import { AccountsPayableComponent } from './modules/accounts/payable/accounts-payable/accounts-payable.component';
import { BankAccountsComponent } from './modules/accounts/bank/bank-accounts/bank-accounts.component';
import { OnboardingComponent } from './modules/onboarding/onboarding.component';
import { FinancialCalendarComponent } from './modules/accounts/financial-calendar/financial-calendar.component';
import { AccountReconciliationComponent } from './modules/accounts/reconciliation/account-reconciliation.component';
import { MonthlyClosingComponent } from './modules/budget/monthly-closing/monthly-closing.component';
import { BackupSettingsComponent } from './modules/settings/backup/backup-settings.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'main'
    },
    {
        path: 'main',
        data: { showInMenu: true, childrenOnly: true },
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard'
            },
            {
                path: 'dashboard',
                component: DashboardComponent,
                data: { label: 'Dashboard', icon: 'dashboard' }
            },
            {
                path: 'start',
                component: OnboardingComponent,
                data: { label: 'Primeiros Passos', icon: 'rocket_launch' }
            },
            {
                path: 'investments',
                data: { linkType: 'dropdown', label: 'Investimentos', icon: 'query_stats' },
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'dashboard'
                    },
                    {
                        path: 'dashboard',
                        component: InvestmentsDashboardComponent,
                        data: { label: 'Visão Geral', icon: 'monitoring' }
                    }
                ]
            },
            {
                path: 'transactions',
                data: { linkType: 'dropdown', label: 'Transações', icon: 'monetization_on' },
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'history'
                    },
                    {
                        path: 'history',
                        component: TransactionsHistoryComponent,
                        data: { label: 'Histórico', icon: 'history' }
                    },
                    {
                        path: 'statement-import',
                        component: StatementImportComponent,
                        data: { label: 'Importar Extrato', icon: 'upload_file' }
                    },
                    {
                        path: 'categories',
                        component: CategoriesListComponent,
                        data: { label: 'Categorias', icon: 'category' }
                    },
                    {
                        path: 'category-rules',
                        component: CategoryRulesComponent,
                        data: { label: 'Regras de Categorias', icon: 'rule' }
                    }
                ]
            },
            {
                path: 'budget',
                data: { linkType: 'dropdown', label: 'Orçamentos', icon: 'analytics' },
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'expense-budgets'
                    },
                    {
                        path: 'expense-budgets',
                        component: ExpenseBudgetsComponent,
                        data: { label: 'Metas de Despesas', icon: 'money_off' }
                    },
                    {
                        path: 'savings-targets',
                        component: SavingsTargetsComponent,
                        data: { label: 'Metas de Poupança', icon: 'savings' }
                    },
                    {
                        path: 'monthly-closing',
                        component: MonthlyClosingComponent,
                        data: { label: 'Fechamento Mensal', icon: 'lock' }
                    }
                ]
            },
            {
                path: 'account',
                data: { linkType: 'dropdown', label: 'Contas', icon: 'account_balance' },
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'bank-accounts'
                    },
                    {
                        path: 'accounts-receivable',
                        component: AccountsReceivableComponent,
                        data: { label: 'Contas a Receber', icon: 'request_quote' }
                    },
                    {
                        path: 'accounts-payable',
                        component: AccountsPayableComponent,
                        data: { label: 'Contas a Pagar', icon: 'receipt_long' }
                    },
                    {
                        path: 'bank-accounts',
                        component: BankAccountsComponent,
                        data: { label: 'Contas Bancárias', icon: 'credit_card' }
                    },
                    {
                        path: 'calendar',
                        component: FinancialCalendarComponent,
                        data: { label: 'Calendario Financeiro', icon: 'event' }
                    },
                    {
                        path: 'reconciliation',
                        component: AccountReconciliationComponent,
                        data: { label: 'Conciliacao', icon: 'fact_check' }
                    }
                ]
            },
            {
                path: 'settings',
                data: { linkType: 'dropdown', label: 'Configuracoes', icon: 'settings' },
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'backup'
                    },
                    {
                        path: 'backup',
                        component: BackupSettingsComponent,
                        data: { label: 'Backup', icon: 'backup' }
                    }
                ]
            }
        ]
    }
];
