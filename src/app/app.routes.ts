import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { InvestmentsDashboardComponent } from './modules/investments/investments-dashboard.component/investments-dashboard.component';
import { TransactionsHistoryComponent } from './modules/transactions/history/history.component';
import { StatementImportComponent } from './modules/transactions/statement-import/statement-import.component';
import { TransactionCategoriesComponent } from './modules/transactions/categories/categories.component';
import { SavingsTargetsComponent } from './modules/budget/savings-targets.component/savings-targets.component';
import { ExpenseBudgetsComponent } from './modules/budget/expense-budgets/expense-budgets.component';
import { BankAccountsComponent } from './modules/accounts/bank-accounts/bank-accounts.component';

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
                        component: TransactionCategoriesComponent,
                        data: { label: 'Categorias', icon: 'category' }
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
                        path: 'bank-accounts',
                        component: BankAccountsComponent,
                        data: { label: 'Contas Bancárias', icon: 'credit_card' }
                    }
                ]
            }
        ]
    }
];
