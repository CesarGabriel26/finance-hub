import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, TrendingUp, Wallet, Target, Trash2, ArrowRight, History, Landmark, Info, X } from 'lucide-angular';
import { DatabaseService, Asset, InvestmentEntry, Account } from '../../services/database.service';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.css'
})
export class InvestmentsComponent implements OnInit {
  // Icons
  readonly PlusIcon = Plus;
  readonly TrendingUpIcon = TrendingUp;
  readonly WalletIcon = Wallet;
  readonly TargetIcon = Target;
  readonly TrashIcon = Trash2;
  readonly ArrowRightIcon = ArrowRight;
  readonly HistoryIcon = History;
  readonly LandmarkIcon = Landmark;
  readonly InfoIcon = Info;
  readonly XIcon = X;

  // State
  assets = signal<Asset[]>([]);
  accounts = signal<Account[]>([]);
  selectedAsset = signal<Asset | null>(null);
  entries = signal<InvestmentEntry[]>([]);

  // Modals
  showAssetModal = signal(false);
  showEntryModal = signal(false);

  // Form Models
  newAsset: Partial<Asset> = { name: '', type: 'renda_fixa', objective_value: 0 };
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

  constructor(private db: DatabaseService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const [assets, accounts] = await Promise.all([
      this.db.getAssets(),
      this.db.getAccounts()
    ]);
    this.assets.set(assets);
    this.accounts.set(accounts);
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
    this.newAsset = { name: '', type: 'renda_fixa', objective_value: 0 };
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
