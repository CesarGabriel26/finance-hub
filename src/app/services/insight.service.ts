import { Injectable, inject } from '@angular/core';
import { Insight } from '../models/database.models';
import { BudgetService } from './budget.service';
import { PredictionService } from './prediction.service';
import { AccountService } from './account.service';
import { BillService } from './bill.service';
import { InvestmentService } from './investment.service';
import { CategoryService } from './category.service';
import { getDayOfMonth, getDaysRemainingInMonth } from '../utils/date.utils';
import { HolidaysService } from './api/holidays.service';
import { FinancialWindowService } from './financial-window.service';

@Injectable({
  providedIn: 'root'
})
export class InsightService {

  constructor(
    private budgetService: BudgetService,
    private predictionService: PredictionService,
    private accountService: AccountService,
    private billService: BillService,
    private investmentService: InvestmentService,
    private categoryService: CategoryService,
    private holidaysService: HolidaysService,
    private financialWindowService: FinancialWindowService
  ) { }

  async generateInsights(period: string, dashboardProcessedData: any): Promise<Insight[]> {
    const insights: Insight[] = [];
    const { revenues, expenses, expensesByCategory, expensesByCategoryId, prevExpenses, highestCat } = dashboardProcessedData;

    const [year, month] = period.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Fetch external data concurrently
    const [budgets, accounts, bills, pendingRevenues, assets, categories] = await Promise.all([
      this.budgetService.getBudgets(month, year),
      this.accountService.getAccounts(),
      this.billService.getBills('D', 'pending'),
      this.billService.getBills('C', 'pending'),
      this.investmentService.getAssets(),
      this.categoryService.getCategories()
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    // Only pending bills for the selected period if possible, but the API might return all pending. 
    // Usually, getBills('D', 'pending') returns current unresolved bills.

    const pendingBillsAmount = bills.reduce((sum, bill) => {
      const dueDate = new Date(bill.due_date);
      const billYear = dueDate.getFullYear();
      const billMonth = dueDate.getMonth() + 1;
      const billDay = dueDate.getDate();

      // "só leve em conta contas pendentes no mes atual q se apliquem do dia atual para frente"
      if (billYear === currentYear && billMonth === currentMonth && billDay >= currentDay) {
        return sum + bill.amount;
      }
      return sum;
    }, 0);
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

    // 5. Dynamic 50/30/20 Rule
    const fixedCategoryIds = categories.filter(c => c.is_fixed).map(c => c.id).filter(id => id !== undefined) as number[];
    const fixedSpent = fixedCategoryIds.reduce((sum, id) => sum + (expensesByCategoryId[id] || 0), 0);
    const variableSpent = expenses - fixedSpent;

    if (revenues > 0) {
      const fixedPct = (fixedSpent / revenues) * 100;
      const variablePct = (variableSpent / revenues) * 100;

      let idealFixedPct = 50;
      let idealVarPct = 30;

      // Adapt thresholds for lower incomes where survival takes more % naturally
      if (revenues <= 3000) {
        idealFixedPct = 65;
        idealVarPct = 25;
      } else if (revenues <= 5000) {
        idealFixedPct = 60;
        idealVarPct = 30;
      }

      if (fixedPct > idealFixedPct + 5) {
        insights.push({
          id: 'high_fixed_costs_dynamic',
          type: 'structure',
          title: 'Custos Fixos Elevados',
          description: `Seus custos essenciais (sobrevivência) consomem ${fixedPct.toFixed(0)}% da renda (ideal pro seu perfil: ${idealFixedPct}%). Tente não assumir mais dívidas fixas.`,
          severity: 'warning',
          priority: 90
        });
      }
      if (variablePct > idealVarPct + 5) {
        insights.push({
          id: 'high_variable_costs_dynamic',
          type: 'guidance',
          title: 'Gastos de Curtição Altos',
          description: `Os gastos variáveis (lazer, compras) estão em ${variablePct.toFixed(0)}% da renda (ideal: ${idealVarPct}%). Cuidado com gastos menores frequentes.`,
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

    // 10. Safe Daily Spending (Conservative & Realistic)
    const fixedCategoryIdsForWindow = new Set(categories.filter(c => c.is_fixed).map(c => c.id).filter(id => id !== undefined) as number[]);

    const financialWindow = await this.financialWindowService.calculateWindowMetrics(
        totalBalance,
        pendingRevenues,
        bills,
        fixedCategoryIdsForWindow
    );

    const safeDailyRealistic = financialWindow.realisticSafeDaily;
    const safeDailyOptimistic = financialWindow.optimisticSafeDaily;
    const daysToNextIncome = financialWindow.daysToNextIncome;

    if ((safeDailyOptimistic > 0 || safeDailyRealistic > 0) && revenues > 0) {
      const minDaily = Math.min(safeDailyRealistic, safeDailyOptimistic);
      const maxDaily = Math.max(safeDailyRealistic, safeDailyOptimistic);
      
      insights.push({
        id: 'safe_spending',
        type: 'guidance',
        title: 'Gasto Diário Seguro',
        description: `Você pode gastar entre R$ ${minDaily.toFixed(0)} e R$ ${maxDaily.toFixed(0)} por dia dependendo da entrada da sua próxima renda.\n\n🟡 Você precisa manter esse ritmo por mais ${daysToNextIncome} dias\n💰 Após isso, sua renda entra novamente`,
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

  async simulateExpense(
    amount: number,
    categoryId: number | null,
    period: string,
    dashboardProcessedData: any
  ): Promise<any> {
    const { revenues, expensesByCategoryId } = dashboardProcessedData;
    const [year, month] = period.split('-').map(Number);

    const [budgets, accounts, bills, pendingRevenues, categories] = await Promise.all([
      this.budgetService.getBudgets(month, year),
      this.accountService.getAccounts(),
      this.billService.getBills('D', 'pending'),
      this.billService.getBills('C', 'pending'),
      this.categoryService.getCategories()
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const fixedCategories = new Set(categories.filter(c => c.is_fixed).map(c => c.id));

    // Contas vitais (fixas) que ainda não foram pagas no mês selecionado
    const [yearSel, monthSel] = period.split('-').map(Number);
    const monthStart = new Date(yearSel, monthSel - 1, 1);
    const monthEnd = new Date(yearSel, monthSel, 0);

    const essentialBillsTotal = bills.reduce((sum, bill) => {
      const dueDate = new Date(bill.due_date);
      const isFixed = bill.recurrence_classification === 'fixed' || (bill.category_id && fixedCategories.has(bill.category_id));
      const inPeriod = dueDate >= monthStart && dueDate <= monthEnd;
      return sum + (isFixed && inPeriod ? bill.amount : 0);
    }, 0);

    const result: any = {
      status: 'success',
      title: 'Pode Gastar ✅',
      descriptions: [],
      invisibleImpact: {
        workDays: 0,
        budgetPercentage: null
      },
      suggest24hRule: false
    };

    // Safe Daily Limit Calculation (Replicated logic for consistency)
    const fixedCategoryIdsForWindow = new Set(categories.filter(c => c.is_fixed).map(c => c.id).filter(id => id !== undefined) as number[]);

    const financialWindow = await this.financialWindowService.calculateWindowMetrics(
        totalBalance,
        pendingRevenues,
        bills,
        fixedCategoryIdsForWindow
    );

    const safeDaily = Math.min(financialWindow.realisticSafeDaily, financialWindow.optimisticSafeDaily);

    // Impacto invisível
    if (revenues > 0) {
      const dailyIncome = revenues / 22; // media de 22 dias uteis
      result.invisibleImpact.workDays = amount / dailyIncome;
    }

    let budgetWarning = false;

    if (categoryId) {
      const budget = budgets.find(b => b.category_id === categoryId);
      if (budget) {
        const spent = expensesByCategoryId[categoryId] || 0;
        result.invisibleImpact.budgetPercentage = (amount / budget.monthly_limit) * 100;

        if (spent + amount > budget.monthly_limit) {
          budgetWarning = true;
          result.descriptions.push(`Este gasto fará você ultrapassar seu limite mensal para esta categoria em R$ ${((spent + amount) - budget.monthly_limit).toFixed(2)}.`);
        } else {
          result.descriptions.push(`Ponto positivo: Você ainda ficará dentro do orçamento desta categoria.`);
        }
      }
    }

    // Regras de Status & Safe Daily Warning
    const availableTotal = totalBalance - essentialBillsTotal; // O que realmente tem "sobrando"

    if (amount > availableTotal) {
      result.status = 'critical';
      result.title = 'Não deveria gastar ❌';
      result.descriptions.unshift(`PERIGO: Este gasto (R$ ${amount.toFixed(2)}) é maior que todo o seu saldo livre após reservar o dinheiro das contas fixas (R$ ${availableTotal.toFixed(2)}).`);
      result.suggest24hRule = true;
    } else if (amount > safeDaily) {
      result.status = 'warning';
      result.title = 'Pode, mas vai apertar ⚠️';
      result.descriptions.unshift(`Cuidado: Este gasto (R$ ${amount.toFixed(2)}) ultrapassa o seu Limite Diário Seguro de R$ ${safeDaily.toFixed(2)}. Isso pode acelerar demais o consumo do seu saldo.`);
      result.suggest24hRule = true;
    } else if (budgetWarning) {
      result.status = 'warning';
      result.title = 'Pode, mas vai apertar ⚠️';
      result.descriptions.unshift('Você tem saldo, mas irá furar o seu planejamento de orçamento para esta categoria.');
      result.suggest24hRule = true;
    } else {
      result.descriptions.unshift('Tudo certo! Este gasto está dentro do seu limite diário e não compromete suas obrigações.');
    }

    // Regra 24h por impacto invisível
    if (result.invisibleImpact.workDays > 4) {
      result.suggest24hRule = true;
      result.descriptions.push(`Choque de realidade: Este item equivale a ${result.invisibleImpact.workDays.toFixed(1)} dias do seu trabalho.`);
    }

    return result;
  }

  async explainExpenseVariation(dashboardProcessedData: any, prevDashboardProcessedData: any): Promise<any[]> {
    if (!dashboardProcessedData || !prevDashboardProcessedData) return [];

    const categories = await this.categoryService.getCategories();
    const currentMap = dashboardProcessedData.expensesByCategoryId || {};
    const prevMap = prevDashboardProcessedData.expensesByCategoryId || {};

    const variations: any[] = [];

    for (const catIdStr of Object.keys(currentMap)) {
      const catId = Number(catIdStr);
      const currentVal = currentMap[catId];
      const prevVal = prevMap[catId] || 0;

      const diff = currentVal - prevVal;
      if (diff > 50) { // só consideramos aumento maior que 50 reais como notável
        const catName = categories.find(c => c.id === catId)?.name || 'Outros';
        variations.push({
          categoryId: catId,
          categoryName: catName,
          diff: diff,
          currentVal,
          prevVal,
          text: `+R$ ${diff.toFixed(2)} em ${catName}`
        });
      }
    }

    // Retorna os top 3 aumentos de despesa
    return variations.sort((a, b) => b.diff - a.diff).slice(0, 3);
  }
}
