import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { LucideAngularModule, List, Wallet, Tags, FileUp, Brain, ArrowDownCircle, ArrowUpCircle, ShieldAlert, TrendingUp, Menu, X, ChevronDown, ChevronRight, LayoutDashboard, Bell, Settings } from 'lucide-angular';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, LucideAngularModule],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent {
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronRightIcon = ChevronRight;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly BellIcon = Bell;
  readonly SettingsIcon = Settings;

  isMobileMenuOpen = signal(false);
  expandedGroups = signal<Record<string, boolean>>({});

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
    { label: 'Configurações', route: '/settings', icon: Settings }
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
