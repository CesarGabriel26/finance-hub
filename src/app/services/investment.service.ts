import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Asset, InvestmentEntry } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private db = inject(DatabaseService);

  async getAssets(): Promise<Asset[]> {
    return this.db.handleApi<Asset[]>('getAssets');
  }

  async addAsset(asset: Partial<Asset>): Promise<any> {
    return this.db.handleApi('addAsset', asset);
  }

  async updateAsset(id: number, asset: Partial<Asset>): Promise<any> {
    return this.db.handleApi('updateAsset', id, asset);
  }

  async deleteAsset(id: number): Promise<any> {
    return this.db.handleApi('deleteAsset', id);
  }

  async getInvestmentEntries(assetId: number): Promise<InvestmentEntry[]> {
    return this.db.handleApi<InvestmentEntry[]>('getInvestmentEntries', assetId);
  }

  async getAllInvestmentEntries(): Promise<InvestmentEntry[]> {
    return this.db.handleApi<InvestmentEntry[]>('getAllInvestmentEntries');
  }

  async addInvestmentEntry(entry: Partial<InvestmentEntry>): Promise<any> {
    return this.db.handleApi('addInvestmentEntry', entry);
  }

  async deleteInvestmentEntry(id: number): Promise<any> {
    return this.db.handleApi('deleteInvestmentEntry', id);
  }

  async getMonthlyStats(months: number = 12): Promise<any[]> {
    return this.db.handleApi<any[]>('getMonthlyStats', months);
  }

  calculateAnalysis(
    selectedAsset: Asset | null,
    allEntries: InvestmentEntry[],
    monthlyStats: any[],
    totalObjective: number,
    totalInvested: number,
    simulatedContribution: number | null
  ) {
    const entries = allEntries.filter(e => !selectedAsset || e.asset_id === selectedAsset.id);
    
    // 1. Group by month
    const depositsByMonth: { [key: string]: number } = {};
    entries.filter(e => e.type === 'deposit').forEach(e => {
        const month = e.date.substring(0, 7);
        depositsByMonth[month] = (depositsByMonth[month] || 0) + e.amount;
    });

    const months = Object.keys(depositsByMonth).sort().reverse();
    const last6Months = months.slice(0, 6);
    const averageContribution = last6Months.length > 0 
        ? last6Months.reduce((sum, m) => sum + depositsByMonth[m], 0) / last6Months.length 
        : 0;

    // 2. Projections
    const objective = selectedAsset ? (selectedAsset.objective_value || 0) : totalObjective;
    const invested = selectedAsset ? (selectedAsset.total_invested || 0) : totalInvested;
    
    const currentContribution = simulatedContribution ?? averageContribution;
    const remainingToGoal = Math.max(0, objective - invested);
    const monthsToGoal = currentContribution > 0 ? Math.ceil(remainingToGoal / currentContribution) : Infinity;
    
    const targetDate = new Date();
    if (monthsToGoal !== Infinity && monthsToGoal > 0) {
        targetDate.setMonth(targetDate.getMonth() + monthsToGoal);
    }

    // 3. Current Month Analysis
    const currentMonth = new Date().toISOString().substring(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7);
    
    const currentMonthDeposit = depositsByMonth[currentMonth] || 0;
    const lastMonthDeposit = depositsByMonth[lastMonth] || 0;
    
    const currentMonthRevenue = monthlyStats.find(s => s.period === currentMonth)?.total_revenue || 0;
    const investedPercentage = currentMonthRevenue > 0 ? (currentMonthDeposit / currentMonthRevenue) * 100 : 0;

    // 4. Consistency
    let consecutiveMonths = 0;
    const sortedDepositMonths = Object.keys(depositsByMonth).sort().reverse();
    
    if (sortedDepositMonths.length > 0) {
        const nowP = new Date().toISOString().substring(0, 7);
        const lastP = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7);
        
        let streakCheckDate = new Date();
        if (depositsByMonth[nowP] === 0 && depositsByMonth[lastP] > 0) {
            streakCheckDate.setMonth(streakCheckDate.getMonth() - 1);
        }

        while (true) {
            const p = streakCheckDate.toISOString().substring(0, 7);
            if (depositsByMonth[p] > 0) {
                consecutiveMonths++;
                streakCheckDate.setMonth(streakCheckDate.getMonth() - 1);
            } else {
                break;
            }
        }
    }

    // 5. Insights
    const insights: string[] = [];
    const isSelected = !!selectedAsset;
    
    if (!isSelected && investedPercentage > 0 && investedPercentage < 20) {
        insights.push("Você está investindo abaixo do recomendado (20%). Tente aumentar seus aportes.");
    }
    if (currentMonthDeposit < lastMonthDeposit && lastMonthDeposit > 0) {
        insights.push(`${isSelected ? 'Os aportes neste ativo' : 'Seus aportes totais'} caíram em relação ao mês passado.`);
    }
    if (averageContribution > 0 && monthsToGoal !== Infinity) {
        insights.push(`Mantendo a média, você atingirá o objetivo ${isSelected ? 'deste ativo' : 'total'} em aproximadamente ${monthsToGoal} meses.`);
    }
    if (consecutiveMonths >= 3) {
        insights.push(`Incrível! Você mantém consistência ${isSelected ? 'neste ativo ' : ''}há ${consecutiveMonths} meses.`);
    }

    return {
        averageContribution,
        remainingToGoal,
        monthsToGoal,
        targetDate,
        investedPercentage,
        consecutiveMonths,
        insights,
        depositsByMonth,
        currentMonthDeposit,
        lastMonthDeposit
    };
  }

  getChartData(depositsByMonth: { [key: string]: number }) {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const p = d.toISOString().substring(0, 7);
        labels.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
        values.push(depositsByMonth[p] || 0);
    }
    
    return { labels, values };
  }
}
