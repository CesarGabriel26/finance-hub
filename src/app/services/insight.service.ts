import { Injectable, inject } from '@angular/core';
import { Insight, Budget } from '../models/database.models';
import { BudgetService } from './budget.service';
import { PredictionService } from './prediction.service';

@Injectable({
  providedIn: 'root'
})
export class InsightService {
  private budgetService = inject(BudgetService);
  private predictionService = inject(PredictionService);

  async generateInsights(period: string, dashboardProcessedData: any): Promise<Insight[]> {
    const insights: Insight[] = [];
    const { revenues, expenses, expensesByCategory, prevExpenses, highestCat } = dashboardProcessedData;

    // 1. Budget Exceeded
    const [year, month] = period.split('-').map(Number);
    const budgets = await this.budgetService.getBudgets(month, year);
    
    for (const budget of budgets) {
      if (!budget.monthly_limit || budget.monthly_limit <= 0) continue;
      
      const spent = expensesByCategory[budget.category_name || ''] || 0;
      if (spent > budget.monthly_limit) {
        insights.push({
          id: `budget_exceeded_${budget.category_id}`,
          type: 'budget',
          title: 'Orçamento Excedido',
          description: `Você ultrapassou o limite de ${budget.category_name} em R$ ${(spent - budget.monthly_limit).toFixed(2)}.`,
          severity: 'critical',
          priority: 100
        });
      } else if (spent >= budget.monthly_limit * (budget.alert_threshold_percentage || 80) / 100) {
        insights.push({
          id: `budget_warning_${budget.category_id}`,
          type: 'budget',
          title: 'Atenção ao Orçamento',
          description: `Você atingiu ${(spent / budget.monthly_limit * 100).toFixed(0)}% do limite de ${budget.category_name}.`,
          severity: 'warning',
          priority: 80
        });
      }
    }

    // 2. Expense Increase
    if (prevExpenses > 0) {
      const increase = ((expenses - prevExpenses) / prevExpenses) * 100;
      if (increase > 15) {
        insights.push({
          id: 'expense_increase',
          type: 'trend',
          title: 'Aumento de Gastos',
          description: `Seus gastos aumentaram ${increase.toFixed(0)}% em relação ao mês passado.`,
          severity: 'warning',
          priority: 70
        });
      }
    }

    // 3. High Fixed Costs (Approximation from categories like 'Moradia', 'Contas', 'Assinaturas')
    const fixedCategories = ['Moradia', 'Contas', 'Assinaturas', 'Educação'];
    const fixedSpent = Object.keys(expensesByCategory)
      .filter(cat => fixedCategories.includes(cat))
      .reduce((sum, cat) => sum + expensesByCategory[cat], 0);

    if (revenues > 0 && (fixedSpent / revenues) > 0.6) {
      insights.push({
        id: 'high_fixed_costs',
        type: 'structure',
        title: 'Custos Fixos Elevados',
        description: 'Seus custos fixos estão consumindo mais de 60% da sua renda.',
        severity: 'critical',
        priority: 90
      });
    }

    // 4. Opportunity Insight (Higher category)
    if (highestCat.name && expenses > 0) {
      const perc = (highestCat.amount / expenses) * 100;
      if (perc > 40) {
        insights.push({
          id: 'top_category_insight',
          type: 'opportunity',
          title: 'Maior Centro de Gasto',
          description: `A categoria ${highestCat.name} representa ${perc.toFixed(0)}% de todos os seus gastos.`,
          severity: 'info',
          priority: 50
        });
      }
    }

    // 5. Predictive Balance Warning
    const balance7d = await this.predictionService.getPredictiveBalance(7);
    if (balance7d < 0) {
      insights.push({
        id: 'negative_prediction_7d',
        type: 'prediction',
        title: 'Risco de Saldo Negativo',
        description: 'Sua projeção de saldo para os próximos 7 dias é negativa.',
        severity: 'critical',
        priority: 110
      });
    }

    // Sort by priority and limit
    return insights
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }
}
