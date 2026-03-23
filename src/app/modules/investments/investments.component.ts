import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, TrendingUp, Wallet, Target, Trash2, ArrowRight, History, Landmark, Info, X, TrendingDown, Calendar, Percent, Lightbulb, Zap } from 'lucide-angular';
import { InvestmentService } from '../../services/investment.service';
import { AccountService } from '../../services/account.service';
import { Asset, InvestmentEntry, Account } from '../../models/database.models';
import { DialogService } from '../../services/dialog.service';
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
    return this.investmentService.calculateAnalysis(
      this.selectedAsset(),
      this.allEntries(),
      this.monthlyStats(),
      this.totalObjective(),
      this.totalInvested(),
      this.simulatedContribution()
    );
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
    const { labels, values } = this.investmentService.getChartData(this.analysis().depositsByMonth);

    const isAssetSelected = !!this.selectedAsset();

    return {
        labels,
        datasets: [{
            data: values,
            label: isAssetSelected ? 'Aportes no Ativo' : 'Aportes Globais',
            borderColor: isAssetSelected ? '#10B981' : '#3B82F6',
            backgroundColor: isAssetSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: isAssetSelected ? '#10B981' : '#3B82F6',
            pointRadius: 4
        }]
    };
  });

  private investmentService = inject(InvestmentService);
  private accountService = inject(AccountService);
  private dialog = inject(DialogService);

  constructor() {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const [assets, accounts, allEntries, stats] = await Promise.all([
      this.investmentService.getAssets(),
      this.accountService.getAccounts(),
      this.investmentService.getAllInvestmentEntries(),
      this.investmentService.getMonthlyStats(12)
    ]);
    this.assets.set(assets);
    this.accounts.set(accounts);
    this.allEntries.set(allEntries);
    this.monthlyStats.set(stats);
  }

  async selectAsset(asset: Asset) {
    if (this.selectedAsset()?.id === asset.id) {
        this.selectedAsset.set(null);
        this.entries.set([]);
    } else {
        this.selectedAsset.set(asset);
        this.simulatedContribution.set(null); // Reset simulation for new asset
        if (asset.id) {
            const entries = await this.investmentService.getInvestmentEntries(asset.id);
            this.entries.set(entries);
        }
    }
  }

  async saveAsset() {
    if (!this.newAsset.name) return;
    await this.investmentService.addAsset(this.newAsset);
    this.newAsset = { name: '', type: 'renda_fixa', objective_value: 0, initial_balance: 0 };
    this.showAssetModal.set(false);
    this.loadData();
  }

  async deleteAsset(id: number, event: Event) {
    event.stopPropagation();
    if (await this.dialog.confirm('Tem certeza que deseja excluir este investimento? Todos os lançamentos serão removidos.', 'error', 'Excluir Investimento')) {
      await this.investmentService.deleteAsset(id);
      if (this.selectedAsset()?.id === id) {
        this.selectedAsset.set(null);
      }
      this.loadData();
    }
  }

  async saveEntry() {
    if (!this.newEntry.amount || !this.newEntry.account_id || !this.newEntry.asset_id) return;
    
    await this.investmentService.addInvestmentEntry(this.newEntry);
    this.showEntryModal.set(false);
    
    // Refresh
    this.loadData();
    if (this.selectedAsset()?.id === this.newEntry.asset_id) {
      const entries = await this.investmentService.getInvestmentEntries(this.newEntry.asset_id as number);
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
    if (await this.dialog.confirm('Excluir este lançamento?', 'warning', 'Excluir Lançamento')) {
      await this.investmentService.deleteInvestmentEntry(id);
      this.loadData();
      if (this.selectedAsset()) {
        const entries = await this.investmentService.getInvestmentEntries(this.selectedAsset()!.id as number);
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
