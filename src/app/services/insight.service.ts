import { Injectable, inject } from '@angular/core';
import { Insight } from '../models/database.models';
import { BudgetService } from './budget.service';
import { PredictionService } from './prediction.service';
import { AccountService } from './account.service';
import { BillService } from './bill.service';
import { InvestmentService } from './investment.service';
import { CategoryService } from './category.service';
import { getDayOfMonth, getDaysRemainingInMonth } from '../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class InsightService {
  private budgetService = inject(BudgetService);
  private predictionService = inject(PredictionService);
  private accountService = inject(AccountService);
  private billService = inject(BillService);
  private investmentService = inject(InvestmentService);
  private categoryService = inject(CategoryService);

  async generateInsights(period: string, dashboardProcessedData: any): Promise<Insight[]> {
    const insights: Insight[] = [];
    const { revenues, expenses, expensesByCategory, expensesByCategoryId, prevExpenses, highestCat } = dashboardProcessedData;

    const [year, month] = period.split('-').map(Number);
    
    // Fetch external data concurrently
    const [budgets, accounts, bills, assets, categories] = await Promise.all([
      this.budgetService.getBudgets(month, year),
      this.accountService.getAccounts(),
      this.billService.getBills('D', 'pending'),
      this.investmentService.getAssets(),
      this.categoryService.getCategories()
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    // Only pending bills for the selected period if possible, but the API might return all pending. 
    // Usually, getBills('D', 'pending') returns current unresolved bills.
    const pendingBillsAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalInvestments = assets.reduce((sum, asset) => sum + (asset.total_invested || 0), 0);
    const totalLiquidity = Math.max(0, totalBalance);

    // 1. Emergency Fund (Reserva de Emergência)
    const reserveRecommended = expenses > 0 ? expenses * 6 : 0;
    const reserveMinimum = expenses > 0 ? expenses * 3 : 0;
    const totalAssets = totalLiquidity + totalInvestments;
    
    if (expenses > 0) {
      if (totalAssets === 0) {
        insights.push({
          id: 'emergency_fund_critical',
          type: 'risk',
          title: 'Sem Reserva de Emergência',
          description: 'Você não possui saldo ou investimentos para cobrir imprevistos. Considere poupar urgente.',
          severity: 'critical',
          priority: 120
        });
      } else if (totalAssets < reserveMinimum) {
        insights.push({
          id: 'emergency_fund_warning',
          type: 'risk',
          title: 'Reserva de Emergência Baixa',
          description: `Seu patrimônio cobre menos de 3 meses dos seus gastos. O ideal é ter no mínimo R$ ${reserveRecommended.toFixed(2)}.`,
          severity: 'warning',
          priority: 85
        });
      } else if (totalAssets >= reserveRecommended) {
        insights.push({
          id: 'emergency_fund_good',
          type: 'positive',
          title: 'Reserva de Segurança Excelente',
          description: 'Você tem patrimônio suficiente para cobrir mais de 6 meses de suas despesas. Parabéns!',
          severity: 'info',
          priority: 45
        });
      }
    }

    // 2. Liquidity vs Bills
    if (totalBalance < pendingBillsAmount) {
       insights.push({
         id: 'liquidity_risk',
         type: 'risk',
         title: 'Risco de Inadimplência',
         description: `Seu saldo atual (R$ ${totalBalance.toFixed(2)}) não é suficiente para pagar as contas ativas do mês (R$ ${pendingBillsAmount.toFixed(2)}).`,
         severity: 'critical',
         priority: 130
       });
    } else if (totalBalance < 0) {
       insights.push({
         id: 'negative_balance_risk',
         type: 'risk',
         title: 'Uso de Limite/Cheque Especial',
         description: `Seu saldo total está negativo (R$ ${totalBalance.toFixed(2)}). Cuidado com os altos juros.`,
         severity: 'critical',
         priority: 125
       });
    }

    // 3. Idle Money
    if (totalBalance > (expenses * 2) && expenses > 0 && totalInvestments < totalBalance) {
      insights.push({
         id: 'idle_money',
         type: 'opportunity',
         title: 'Dinheiro Parado',
         description: 'Você possui um saldo livre considerável na conta. Considere investir para que este dinheiro rentabilize.',
         severity: 'info',
         priority: 60
      });
    }

    // 4. Burn Rate / Ritmo de Gastos
    const currentDay = getDayOfMonth();
    const daysInMonth = currentDay + getDaysRemainingInMonth();
    if (currentDay > 5 && revenues > 0) {
       const dailyRate = expenses / currentDay;
       const expectedMonthlyExpense = dailyRate * daysInMonth;
       
       if (expectedMonthlyExpense > revenues) {
         insights.push({
            id: 'high_burn_rate',
            type: 'prediction',
            title: 'Ritmo de Gastos Preocupante',
            description: `Neste ritmo (R$ ${dailyRate.toFixed(2)}/dia), sua projeção de gastos do mês ultrapassará sua renda total.`,
            severity: 'critical',
            priority: 115
         });
       }
    }

    // 5. 50/30/20 Rule
    const fixedCategoryIds = categories.filter(c => c.is_fixed).map(c => c.id).filter(id => id !== undefined) as number[];
    const fixedSpent = fixedCategoryIds.reduce((sum, id) => sum + (expensesByCategoryId[id] || 0), 0);
    const variableSpent = expenses - fixedSpent;

    if (revenues > 0) {
      const fixedPct = (fixedSpent / revenues) * 100;
      const variablePct = (variableSpent / revenues) * 100;

      if (fixedPct > 55) {
        insights.push({
          id: 'high_fixed_costs_50_30_20',
          type: 'structure',
          title: 'Custos Fixos Elevados',
          description: `Seus custos fixos consomem ${fixedPct.toFixed(0)}% da renda (ideal: 50%). Isso reduz a margem para lazer e investimentos.`,
          severity: 'warning',
          priority: 90
        });
      }
      if (variablePct > 40) {
        insights.push({
          id: 'high_variable_costs_50_30_20',
          type: 'guidance',
          title: 'Gastos Variáveis Altos',
          description: `Os gastos variáveis consomem ${variablePct.toFixed(0)}% da renda (ideal: 30%). Tente reduzir despesas não essenciais.`,
          severity: 'warning',
          priority: 88
        });
      }
    }

    // 6. Budgets Tracking
    for (const budget of budgets) {
      if (!budget.monthly_limit || budget.monthly_limit <= 0) continue;

      const spent = expensesByCategory[budget.category_name || ''] || 0;
      if (spent > budget.monthly_limit) {
        insights.push({
          id: `budget_exceeded_${budget.category_id}`,
          type: 'budget',
          title: 'Orçamento Excedido',
          description: `Você ultrapassou em R$ ${(spent - budget.monthly_limit).toFixed(2)} o orçamento de ${budget.category_name}.`,
          severity: 'critical',
          priority: 100
        });
      } else if (spent >= budget.monthly_limit * (budget.alert_threshold_percentage || 80) / 100) {
        insights.push({
          id: `budget_warning_${budget.category_id}`,
          type: 'budget',
          title: 'Atenção ao Orçamento',
          description: `Faltam R$ ${(budget.monthly_limit - spent).toFixed(2)} para atingir o limite de ${budget.category_name}.`,
          severity: 'warning',
          priority: 80
        });
      }
    }

    // 7. Expense Increase (Monthly comparison)
    if (prevExpenses > 0) {
      const increase = ((expenses - prevExpenses) / prevExpenses) * 100;
      if (increase > 15) {
        insights.push({
          id: 'expense_increase',
          type: 'trend',
          title: 'Aumento de Gastos',
          description: `Seus gastos aumentaram ${increase.toFixed(0)}% (+R$ ${(expenses - prevExpenses).toFixed(2)}) em relação ao mês anterior.`,
          severity: 'warning',
          priority: 70
        });
      }
    }

    // 8. Top Category Opportunity Insight
    if (highestCat.name && expenses > 0) {
      const perc = (highestCat.amount / expenses) * 100;
      const isFixed = categories.find(c => c.name === highestCat.name)?.is_fixed;

      if (perc > 40 && !isFixed) {
        insights.push({
          id: 'top_category_insight',
          type: 'opportunity',
          title: 'Foco de Redução',
          description: `A categoria ${highestCat.name} representa ${perc.toFixed(0)}% de todos os gastos. Reduzir aqui terá grande impacto.`,
          severity: 'info',
          priority: 50
        });
      }
    }

    // 9. Predictive Balance Warning
    const balance7d = await this.predictionService.getPredictiveBalance(7);
    if (balance7d < 0 && totalBalance >= 0) {
      insights.push({
        id: 'negative_prediction_7d',
        type: 'prediction',
        title: 'Saldo Futuro Negativo',
        description: 'Sua projeção de saldo para os próximos 7 dias é negativa baseado nos lançamentos.',
        severity: 'critical',
        priority: 110
      });
    }

    const balance30d = await this.predictionService.getPredictiveBalance(30);
    if (balance30d > 0 && revenues > 0 && currentDay > 5) {
      const daysRemaining = getDaysRemainingInMonth() || 1;
      const safeDaily = balance30d / daysRemaining;

      insights.push({
        id: 'safe_spending',
        type: 'guidance',
        title: 'Gasto Diário Seguro',
        description: `Para fechar o mês no azul, pode gastar até R$ ${safeDaily.toFixed(2)}/dia.`,
        severity: 'info',
        priority: 95
      });
    }

    if (expenses < revenues * 0.7 && revenues > 0) {
      insights.push({
        id: 'good_control',
        type: 'positive',
        title: 'Controle Financeiro Exemplar',
        description: 'Você manteve grande parte de sua receita este mês. Ótimo momento para programar um investimento.',
        severity: 'info',
        priority: 40
      });
    }

    // Sort by priority and limit to top 8 insights (expanded from 5 to give max feedback as user requested)
    return insights
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  }
}
