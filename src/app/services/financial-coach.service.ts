import { Injectable } from '@angular/core';
import {
  Account,
  AccountPayable,
  AccountReceivable,
  Budget,
  Category,
  InvestmentPortfolioAsset,
  SavingGoal,
  Transaction,
} from '../models';

export type CoachTone = 'good' | 'warning' | 'danger' | 'neutral';

export interface FinancialStreak {
  key: string;
  label: string;
  icon: string;
  days: number;
  targetLabel: string;
  description: string;
  tone: CoachTone;
}

export interface CoachInsight {
  id: string;
  title: string;
  body: string;
  icon: string;
  tone: CoachTone;
  actionLabel?: string;
  route?: string;
}

export interface CoachMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  reward: string;
  route?: string;
}

export interface FinancialCoachInput {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  payables: AccountPayable[];
  receivables: AccountReceivable[];
  investmentAssets: InvestmentPortfolioAsset[];
  currentDate?: Date;
}

export interface FinancialCoachSummary {
  healthScore: number;
  healthLabel: string;
  dailySpendingTarget: number;
  todayConsumerExpense: number;
  monthConsumerExpense: number;
  monthWealthBuilding: number;
  monthIncome: number;
  savingRate: number;
  streaks: FinancialStreak[];
  insights: CoachInsight[];
  missions: CoachMission[];
}

@Injectable({ providedIn: 'root' })
export class FinancialCoachService {
  buildSummary(input: FinancialCoachInput): FinancialCoachSummary {
    const today = input.currentDate ?? new Date();
    const monthTransactions = this.monthTransactions(input.transactions, today);
    const monthIncome = this.monthIncome(monthTransactions);
    const monthConsumerExpense = this.consumerExpenseTotal(monthTransactions, input);
    const monthWealthBuilding = this.wealthBuildingTotal(monthTransactions, input);
    const dailySpendingTarget = this.dailySpendingTarget(input, today, monthIncome);
    const todayConsumerExpense = this.consumerExpenseForDate(input.transactions, input, this.dateKey(today));
    const savingRate = monthIncome > 0 ? (monthWealthBuilding / monthIncome) * 100 : 0;
    const healthScore = this.healthScore(input, today, {
      monthIncome,
      monthConsumerExpense,
      monthWealthBuilding,
      savingRate,
    });

    return {
      healthScore,
      healthLabel: this.healthLabel(healthScore),
      dailySpendingTarget,
      todayConsumerExpense,
      monthConsumerExpense,
      monthWealthBuilding,
      monthIncome,
      savingRate,
      streaks: this.streaks(input, today, dailySpendingTarget),
      insights: this.insights(input, today, {
        healthScore,
        dailySpendingTarget,
        todayConsumerExpense,
        monthIncome,
        monthConsumerExpense,
        monthWealthBuilding,
        savingRate,
      }),
      missions: this.missions(input, today, {
        dailySpendingTarget,
        todayConsumerExpense,
        monthIncome,
        monthWealthBuilding,
      }),
    };
  }

  isWealthBuildingTransaction(transaction: Transaction, input: FinancialCoachInput): boolean {
    if (transaction.ignored) return false;

    const targetAccount = input.accounts.find(account => account.id === transaction.transferAccountId);
    if (transaction.type === 'transfer' && targetAccount?.type === 'investment') {
      return true;
    }

    if (transaction.type !== 'debit') {
      return false;
    }

    const text = this.normalize([
      transaction.description,
      transaction.tags,
      input.categories.find(category => category.id === transaction.categoryId)?.name,
    ].filter(Boolean).join(' '));

    return [
      'invest',
      'aplic',
      'aporte',
      'reserva',
      'poupanca',
      'tesouro',
      'cdb',
      'lci',
      'lca',
      'previdencia',
    ].some(term => text.includes(term));
  }

  consumerExpenseTotal(transactions: Transaction[], input: FinancialCoachInput): number {
    return transactions
      .filter(transaction => transaction.type === 'debit' && !this.isWealthBuildingTransaction(transaction, input))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  private wealthBuildingTotal(transactions: Transaction[], input: FinancialCoachInput): number {
    return transactions
      .filter(transaction => this.isWealthBuildingTransaction(transaction, input))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  private monthIncome(transactions: Transaction[]): number {
    return transactions
      .filter(transaction => transaction.type === 'credit' && !transaction.ignored)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  private dailySpendingTarget(input: FinancialCoachInput, today: Date, monthIncome: number): number {
    const budgetLimit = input.budgets.reduce((sum, budget) => sum + Math.max(0, budget.amountLimit), 0);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    if (budgetLimit > 0) {
      return budgetLimit / daysInMonth;
    }

    if (monthIncome > 0) {
      return (monthIncome * 0.7) / daysInMonth;
    }

    const last30Average = this.lastDays(today, 30)
      .map(date => this.consumerExpenseForDate(input.transactions, input, this.dateKey(date)))
      .reduce((sum, amount) => sum + amount, 0) / 30;

    return last30Average > 0 ? last30Average * 0.9 : 0;
  }

  private streaks(input: FinancialCoachInput, today: Date, dailyTarget: number): FinancialStreak[] {
    const hasHistory = input.transactions.some(transaction => !transaction.ignored);
    const spendingDays = hasHistory && dailyTarget > 0
      ? this.countConsecutiveDays(today, day => this.consumerExpenseForDate(input.transactions, input, this.dateKey(day)) <= dailyTarget)
      : 0;
    const healthDays = hasHistory
      ? this.countConsecutiveDays(today, day => this.dailyHealthScore(input, day, dailyTarget) >= 75)
      : 0;
    const organizedDays = hasHistory
      ? this.countConsecutiveDays(today, day => this.dayIsOrganized(input.transactions, this.dateKey(day)))
      : 0;

    return [
      {
        key: 'spending-pace',
        label: 'Ritmo de gastos',
        icon: 'local_fire_department',
        days: spendingDays,
        targetLabel: dailyTarget > 0 ? `Meta diaria: ${this.currency(dailyTarget)}` : 'Defina um orcamento',
        description: 'Dias seguidos abaixo da media segura de gasto.',
        tone: spendingDays >= 7 ? 'good' : spendingDays >= 3 ? 'neutral' : 'warning',
      },
      {
        key: 'health',
        label: 'Saude em alta',
        icon: 'favorite',
        days: healthDays,
        targetLabel: 'Alvo: 75% ou mais',
        description: 'Dias seguidos mantendo a saude financeira saudavel.',
        tone: healthDays >= 7 ? 'good' : healthDays >= 3 ? 'neutral' : 'warning',
      },
      {
        key: 'organization',
        label: 'Organizacao',
        icon: 'verified',
        days: organizedDays,
        targetLabel: 'Movimentos categorizados',
        description: 'Dias seguidos sem deixar lancamentos sem categoria.',
        tone: organizedDays >= 7 ? 'good' : organizedDays >= 3 ? 'neutral' : 'warning',
      },
    ];
  }

  private insights(
    input: FinancialCoachInput,
    today: Date,
    data: {
      healthScore: number;
      dailySpendingTarget: number;
      todayConsumerExpense: number;
      monthIncome: number;
      monthConsumerExpense: number;
      monthWealthBuilding: number;
      savingRate: number;
    },
  ): CoachInsight[] {
    const insights: CoachInsight[] = [];
    const overdueAmount = input.payables
      .filter(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate < this.dateKey(today))
      .reduce((sum, item) => sum + item.amount, 0);
    const uncategorized = input.transactions
      .filter(transaction => !transaction.ignored && !transaction.categoryId)
      .length;
    const budgetPressure = input.budgets
      .map(budget => {
        const spent = this.consumerExpenseTotal(
          this.monthTransactions(input.transactions, today).filter(transaction => transaction.categoryId === budget.categoryId),
          input,
        );
        return {
          budget,
          category: input.categories.find(category => category.id === budget.categoryId),
          spent,
          usage: budget.amountLimit > 0 ? (spent / budget.amountLimit) * 100 : 0,
        };
      })
      .sort((a, b) => b.usage - a.usage)[0];

    if (overdueAmount > 0) {
      insights.push({
        id: 'overdue-payables',
        title: 'Tem conta atrasada puxando sua saude para baixo',
        body: `${this.currency(overdueAmount)} em contas pendentes ja passaram do vencimento.`,
        icon: 'notification_important',
        tone: 'danger',
        actionLabel: 'Ver agenda',
        route: '/main/account/calendar',
      });
    }

    if (data.dailySpendingTarget > 0 && data.todayConsumerExpense > data.dailySpendingTarget) {
      insights.push({
        id: 'daily-target',
        title: 'Hoje passou da media segura',
        body: `Consumo de hoje: ${this.currency(data.todayConsumerExpense)}. Meta sugerida: ${this.currency(data.dailySpendingTarget)}.`,
        icon: 'speed',
        tone: 'warning',
        actionLabel: 'Ver movimentos',
        route: '/main/transactions/history',
      });
    }

    if (budgetPressure?.usage >= 85) {
      insights.push({
        id: 'budget-pressure',
        title: `${budgetPressure.category?.name ?? 'Um orcamento'} esta perto do limite`,
        body: `${this.formatPercent(budgetPressure.usage)} usado. Pequenas compras nessa categoria ja podem estourar o mes.`,
        icon: 'percent',
        tone: budgetPressure.usage >= 100 ? 'danger' : 'warning',
        actionLabel: 'Abrir orcamentos',
        route: '/main/budget/expense-budgets',
      });
    }

    if (data.monthWealthBuilding > 0) {
      insights.push({
        id: 'wealth-building',
        title: 'Investimento separado de gasto comum',
        body: `${this.currency(data.monthWealthBuilding)} foram tratados como construcao de patrimonio, nao como consumo.`,
        icon: 'savings',
        tone: 'good',
        actionLabel: 'Ver investimentos',
        route: '/main/investments/dashboard',
      });
    }

    if (uncategorized > 0) {
      insights.push({
        id: 'uncategorized',
        title: 'Faltam categorias para melhorar os insights',
        body: `${uncategorized} movimento(s) sem categoria. Categorizar melhora orcamentos, streaks e previsoes.`,
        icon: 'category',
        tone: 'neutral',
        actionLabel: 'Organizar',
        route: '/main/transactions/history',
      });
    }

    if (data.monthIncome > 0 && data.savingRate < 10) {
      insights.push({
        id: 'saving-rate',
        title: 'Daria para criar um ritmo de aporte',
        body: `Voce investiu/poupou ${this.formatPercent(data.savingRate)} da renda do mes. Comecar com 10% ja cria constancia.`,
        icon: 'trending_up',
        tone: 'neutral',
        actionLabel: 'Criar objetivo',
        route: '/main/budget/savings-targets',
      });
    }

    if (input.budgets.length === 0) {
      insights.push({
        id: 'missing-budget',
        title: 'Um limite mensal libera streaks melhores',
        body: 'Crie pelo menos um orcamento para o app calcular uma media diaria mais justa.',
        icon: 'flag',
        tone: 'neutral',
        actionLabel: 'Criar orcamento',
        route: '/main/budget/expense-budgets',
      });
    }

    if (data.healthScore >= 80) {
      insights.push({
        id: 'good-health',
        title: 'Seu ritmo esta saudavel',
        body: 'Continue abaixo da media diaria e mantenha contas em dia para aumentar a sequencia.',
        icon: 'emoji_events',
        tone: 'good',
      });
    }

    return insights.slice(0, 5);
  }

  private missions(
    input: FinancialCoachInput,
    today: Date,
    data: {
      dailySpendingTarget: number;
      todayConsumerExpense: number;
      monthIncome: number;
      monthWealthBuilding: number;
    },
  ): CoachMission[] {
    const uncategorized = input.transactions.filter(transaction => !transaction.ignored && !transaction.categoryId).length;
    const upcoming = input.payables.filter(item => item.status === 'pending' && item.dueDate >= this.dateKey(today)).length;
    const targetContribution = data.monthIncome > 0 ? data.monthIncome * 0.1 : 0;

    return [
      {
        id: 'daily-pace',
        title: 'Fechar o dia dentro da media',
        description: data.dailySpendingTarget > 0
          ? `Faltam ${this.currency(Math.max(0, data.dailySpendingTarget - data.todayConsumerExpense))} ate a meta de hoje.`
          : 'Crie um orcamento para liberar esta missao.',
        icon: 'local_fire_department',
        progress: data.dailySpendingTarget > 0
          ? Math.min(100, (data.todayConsumerExpense / data.dailySpendingTarget) * 100)
          : 0,
        reward: '+1 dia no ritmo',
        route: '/main/dashboard',
      },
      {
        id: 'organize',
        title: 'Organizar movimentos',
        description: uncategorized > 0
          ? `Categorize ${Math.min(uncategorized, 3)} movimento(s) para deixar os insights mais inteligentes.`
          : 'Tudo categorizado por enquanto.',
        icon: 'category',
        progress: uncategorized > 0 ? Math.max(0, 100 - Math.min(100, uncategorized * 20)) : 100,
        reward: 'Insights melhores',
        route: '/main/transactions/history',
      },
      {
        id: 'wealth',
        title: 'Construir patrimonio',
        description: targetContribution > 0
          ? `Meta educativa: aportar ${this.currency(targetContribution)} no mes.`
          : 'Registre uma renda para calcular uma meta de aporte.',
        icon: 'savings',
        progress: targetContribution > 0 ? Math.min(100, (data.monthWealthBuilding / targetContribution) * 100) : 0,
        reward: 'Saude + ritmo',
        route: '/main/investments/dashboard',
      },
      {
        id: 'agenda',
        title: 'Manter contas em dia',
        description: upcoming > 0 ? `${upcoming} conta(s) proximas no radar.` : 'Sem contas proximas pendentes.',
        icon: 'event',
        progress: upcoming > 0 ? 40 : 100,
        reward: 'Evita perda de saude',
        route: '/main/account/calendar',
      },
    ];
  }

  private healthScore(
    input: FinancialCoachInput,
    today: Date,
    data: {
      monthIncome: number;
      monthConsumerExpense: number;
      monthWealthBuilding: number;
      savingRate: number;
    },
  ): number {
    let score = 82;
    const budgetLimit = input.budgets.reduce((sum, budget) => sum + budget.amountLimit, 0);
    const overdue = input.payables.some(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate < this.dateKey(today));

    if (data.monthIncome > 0) {
      const consumptionRate = (data.monthConsumerExpense / data.monthIncome) * 100;
      if (consumptionRate > 100) score -= 24;
      else if (consumptionRate > 85) score -= 14;
      else if (consumptionRate < 65) score += 6;
    }

    if (budgetLimit > 0) {
      const budgetUsage = (data.monthConsumerExpense / budgetLimit) * 100;
      if (budgetUsage > 100) score -= 20;
      else if (budgetUsage > 85) score -= 10;
      else score += 5;
    } else {
      score -= 5;
    }

    if (overdue) score -= 18;
    if (data.savingRate >= 20) score += 8;
    else if (data.savingRate >= 10) score += 4;
    else if (data.monthIncome > 0) score -= 4;
    if (input.savingGoals.some(goal => goal.status !== 'completed')) score += 3;
    if (input.investmentAssets.length > 0) score += 4;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private dailyHealthScore(input: FinancialCoachInput, day: Date, dailyTarget: number): number {
    const dayKey = this.dateKey(day);
    const dayExpense = this.consumerExpenseForDate(input.transactions, input, dayKey);
    const overdue = input.payables.some(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate < dayKey);
    let score = 90;

    if (dailyTarget > 0 && dayExpense > dailyTarget) score -= 22;
    if (overdue) score -= 20;
    if (this.dayIsOrganized(input.transactions, dayKey)) score += 4;

    return Math.max(0, Math.min(100, score));
  }

  private consumerExpenseForDate(transactions: Transaction[], input: FinancialCoachInput, dateKey: string): number {
    return this.consumerExpenseTotal(
      transactions.filter(transaction => transaction.date.slice(0, 10) === dateKey),
      input,
    );
  }

  private dayIsOrganized(transactions: Transaction[], dateKey: string): boolean {
    const dayTransactions = transactions.filter(transaction => !transaction.ignored && transaction.date.slice(0, 10) === dateKey);
    return dayTransactions.length === 0 || dayTransactions.every(transaction => Boolean(transaction.categoryId));
  }

  private countConsecutiveDays(today: Date, pass: (day: Date) => boolean): number {
    let count = 0;

    for (let index = 0; index < 60; index++) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - index);
      if (!pass(day)) break;
      count++;
    }

    return count;
  }

  private lastDays(today: Date, count: number): Date[] {
    return Array.from({ length: count }, (_, index) => (
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - index)
    ));
  }

  private monthTransactions(transactions: Transaction[], today: Date): Transaction[] {
    const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    return transactions.filter(transaction => {
      const date = transaction.date.slice(0, 10);
      return date >= start && date <= end && !transaction.ignored;
    });
  }

  private healthLabel(score: number): string {
    if (score >= 85) return 'Forte';
    if (score >= 75) return 'Boa';
    if (score >= 60) return 'Atencao';
    return 'Revisar';
  }

  private currency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private formatPercent(value: number): string {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
