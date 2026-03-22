import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, TrendingUp, Wallet, Target, Trash2, ArrowRight, History, Landmark, Info, X, TrendingDown, Calendar, Percent, Lightbulb, Zap } from 'lucide-angular';
import { DatabaseService, Asset, InvestmentEntry, Account } from '../../services/database.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BaseChartDirective],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.css'
})
export class InvestmentsComponent implements OnInit {
  // Icons
  readonly PlusIcon = Plus;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;
  readonly WalletIcon = Wallet;
  readonly TargetIcon = Target;
  readonly TrashIcon = Trash2;
  readonly ArrowRightIcon = ArrowRight;
  readonly HistoryIcon = History;
  readonly LandmarkIcon = Landmark;
  readonly InfoIcon = Info;
  readonly XIcon = X;
  readonly CalendarIcon = Calendar;
  readonly PercentIcon = Percent;
  readonly LightbulbIcon = Lightbulb;
  readonly ZapIcon = Zap;
  readonly Infinity = Infinity;

  // State
  assets = signal<Asset[]>([]);
  accounts = signal<Account[]>([]);
  selectedAsset = signal<Asset | null>(null);
  entries = signal<InvestmentEntry[]>([]);

  // Modals
  showAssetModal = signal(false);
  showEntryModal = signal(false);

  // Form Models
  newAsset: Partial<Asset> = { name: '', type: 'renda_fixa', objective_value: 0, initial_balance: 0 };
  newEntry: Partial<InvestmentEntry> = { 
    type: 'deposit', 
    amount: 0, 
    date: new Date().toISOString().substring(0, 10),
    description: ''
  };

  // Stats
  totalInvested = computed(() => 
    this.assets().reduce((sum, a) => sum + (a.total_invested || 0), 0)
  );

  totalObjective = computed(() => 
    this.assets().reduce((sum, a) => sum + (a.objective_value || 0), 0)
  );

  // Analysis Data
  allEntries = signal<InvestmentEntry[]>([]);
  monthlyStats = signal<any[]>([]);
  simulatedContribution = signal<number | null>(null);

  analysis = computed(() => {
    const entries = this.allEntries();
    const stats = this.monthlyStats();
    const assets = this.assets();
    
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
    const currentContribution = this.simulatedContribution() ?? averageContribution;
    const remainingToGoal = Math.max(0, this.totalObjective() - this.totalInvested());
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
    
    const currentMonthRevenue = stats.find(s => s.period === currentMonth)?.total_revenue || 0;
    const investedPercentage = currentMonthRevenue > 0 ? (currentMonthDeposit / currentMonthRevenue) * 100 : 0;

    // 4. Consistency
    let consecutiveMonths = 0;
    const sortedMonths = Object.keys(depositsByMonth).sort().reverse();
    // Check from current or last month
    let checkMonth = new Date();
    while (true) {
        const p = checkMonth.toISOString().substring(0, 7);
        if (depositsByMonth[p] > 0) {
            consecutiveMonths++;
            checkMonth.setMonth(checkMonth.getMonth() - 1);
        } else {
            // Se falhou o mês atual mas teve no anterior, continua? 
            // Vamos considerar apenas se houver investimento no mês.
            break;
        }
    }

    // 5. Insights
    const insights: string[] = [];
    if (investedPercentage > 0 && investedPercentage < 20) {
        insights.push("Você está investindo abaixo do recomendado (20%). Tente aumentar seus aportes.");
    }
    if (currentMonthDeposit < lastMonthDeposit && lastMonthDeposit > 0) {
        insights.push("Seus aportes caíram em relação ao mês passado.");
    }
    if (averageContribution > 0 && monthsToGoal !== Infinity) {
        insights.push(`Mantendo a média, você atingirá seu objetivo total em aproximadamente ${monthsToGoal} meses.`);
    }
    if (consecutiveMonths >= 3) {
        insights.push(`Incrível! Você mantém consistência há ${consecutiveMonths} meses.`);
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
  });

  // Chart configuration
  public chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return 'Aporte: ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y || 0);
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
      x: { grid: { display: false } }
    }
  };

  chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const deposits = this.analysis().depositsByMonth;
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const p = d.toISOString().substring(0, 7);
        labels.push(d.toLocaleDateString('pt-BR', { month: 'short' }));
        values.push(deposits[p] || 0);
    }

    return {
        labels,
        datasets: [{
            data: values,
            label: 'Aportes',
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3B82F6',
            pointRadius: 4
        }]
    };
  });

  private db = inject(DatabaseService);

  constructor() {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const [assets, accounts, allEntries, stats] = await Promise.all([
      this.db.getAssets(),
      this.db.getAccounts(),
      this.db.getAllInvestmentEntries(),
      this.db.getMonthlyStats(12)
    ]);
    this.assets.set(assets);
    this.accounts.set(accounts);
    this.allEntries.set(allEntries);
    this.monthlyStats.set(stats);
  }

  async selectAsset(asset: Asset) {
    this.selectedAsset.set(asset);
    if (asset.id) {
      const entries = await this.db.getInvestmentEntries(asset.id);
      this.entries.set(entries);
    }
  }

  async saveAsset() {
    if (!this.newAsset.name) return;
    await this.db.addAsset(this.newAsset);
    this.newAsset = { name: '', type: 'renda_fixa', objective_value: 0, initial_balance: 0 };
    this.showAssetModal.set(false);
    this.loadData();
  }

  async deleteAsset(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este investimento? Todos os lançamentos serão removidos.')) {
      await this.db.deleteAsset(id);
      if (this.selectedAsset()?.id === id) {
        this.selectedAsset.set(null);
      }
      this.loadData();
    }
  }

  async saveEntry() {
    if (!this.newEntry.amount || !this.newEntry.account_id || !this.newEntry.asset_id) return;
    
    await this.db.addInvestmentEntry(this.newEntry);
    this.showEntryModal.set(false);
    
    // Refresh
    this.loadData();
    if (this.selectedAsset()?.id === this.newEntry.asset_id) {
      const entries = await this.db.getInvestmentEntries(this.newEntry.asset_id as number);
      this.entries.set(entries);
    }

    // Reset entry but keep asset_id if it was selected from asset view
    const currentAssetId = this.newEntry.asset_id;
    this.newEntry = { 
      type: 'deposit', 
      amount: 0, 
      date: new Date().toISOString().substring(0, 10),
      description: '',
      asset_id: currentAssetId
    };
  }

  async deleteEntry(id: number) {
    if (confirm('Excluir este lançamento?')) {
      await this.db.deleteInvestmentEntry(id);
      this.loadData();
      if (this.selectedAsset()) {
        const entries = await this.db.getInvestmentEntries(this.selectedAsset()!.id as number);
        this.entries.set(entries);
      }
    }
  }

  openEntryModal(asset?: Asset) {
    if (asset) {
      this.newEntry.asset_id = asset.id;
    } else if (this.selectedAsset()) {
      this.newEntry.asset_id = this.selectedAsset()!.id;
    }
    this.showEntryModal.set(true);
  }

  calculateProgress(asset: Asset): number {
    if (!asset.objective_value || asset.objective_value <= 0) return 0;
    const progress = ((asset.total_invested || 0) / asset.objective_value) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  getAssetTypeLabel(type?: string): string {
    switch(type) {
      case 'renda_fixa': return 'Renda Fixa';
      case 'cripto': return 'Cripto';
      case 'acoes': return 'Ações';
      case 'outros': return 'Outros';
      default: return 'Investimento';
    }
  }
}
