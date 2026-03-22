import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { LucideAngularModule, List, Wallet, Tags, FileUp, Brain, ArrowDownCircle, ArrowUpCircle, ShieldAlert, TrendingUp, Menu, X, ChevronDown, ChevronRight, LayoutDashboard, Bell, Settings, History } from 'lucide-angular';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, LucideAngularModule],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent implements OnInit {
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronRightIcon = ChevronRight;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly BellIcon = Bell;
  readonly SettingsIcon = Settings;
  readonly HistoryIcon = History;

  isMobileMenuOpen = signal(false);
  expandedGroups = signal<Record<string, boolean>>({});
  currentVersion = signal<string>('');

  async ngOnInit() {
    try {
      const response = await fetch('assets/changelog.json');
      const data = await response.json();
      const versions = Object.keys(data).sort((a, b) => {
        const vA = a.split('.').map(Number);
        const vB = b.split('.').map(Number);
        for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
          const numA = vA[i] || 0;
          const numB = vB[i] || 0;
          if (numA !== numB) return numB - numA;
        }
        return 0;
      });
      if (versions.length > 0) {
        this.currentVersion.set(versions[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar versão:', error);
    }
  }

  menuItems = signal([
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    
    { 
      label: 'Movimentações', 
      icon: List,
      children: [
        { label: 'Movimentos', route: '/movements', icon: List },
        { label: 'Revisar', route: '/review', icon: ShieldAlert },
        { label: 'Importar Extrato', route: '/import-statement', icon: FileUp },
      ]
    },
    
    {
      label: 'Financeiro',
      icon: Wallet,
      children: [
        { label: 'Contas Bancárias', route: '/accounts', icon: Wallet },
        { label: 'Contas a Pagar', route: '/payable', icon: ArrowDownCircle },
        { label: 'Contas a Receber', route: '/receivable', icon: ArrowUpCircle },
      ]
    },

    {
      label: 'Cadastros',
      icon: Tags,
      children: [
        { label: 'Categorias', route: '/categories', icon: Tags },
        { label: 'Palavras-chave', route: '/keywords', icon: Brain },
      ]
    },

    { label: 'Investimentos', route: '/investments', icon: TrendingUp },
    { label: 'Configurações', route: '/settings', icon: Settings },
    { label: 'Changelog', route: '/changelog', icon: History }
  ]);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  toggleGroup(label: string) {
    this.expandedGroups.update(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
