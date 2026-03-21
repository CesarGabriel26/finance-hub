import { Routes } from '@angular/router';
import { AppLayoutComponent } from './modules/app-layout/app-layout.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { MovementsComponent } from './modules/movements/movements.component';
import { AccountsComponent } from './modules/accounts/accounts.component';
import { CategoriesComponent } from './modules/categories/categories.component';
import { ImportStatementComponent } from './modules/import-statement/import-statement.component';
import { KeywordsComponent } from './modules/keywords/keywords.component';
import { PayableComponent } from './modules/payable/payable.component';
import { ReceivableComponent } from './modules/receivable/receivable.component';

import { ReviewComponent } from './modules/review/review.component';
import { InvestmentsComponent } from './modules/investments/investments.component';
import { SettingsComponent } from './modules/settings/settings.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'movements',
        component: MovementsComponent
      },
      {
        path: 'accounts',
        component: AccountsComponent
      },
      {
        path: 'categories',
        component: CategoriesComponent
      },
      {
        path: 'payable',
        component: PayableComponent
      },
      {
        path: 'receivable',
        component: ReceivableComponent
      },
      {
        path: 'review',
        component: ReviewComponent
      },
      {
        path: 'import-statement',
        component: ImportStatementComponent
      },
      {
        path: 'keywords',
        component: KeywordsComponent
      },
      {
        path: 'investments',
        component: InvestmentsComponent
      },
      {
        path: 'settings',
        component: SettingsComponent
      }
    ]
  }
];
