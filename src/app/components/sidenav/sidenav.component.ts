import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { NavItem, NavLink, NavDropDown } from './sidenav';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit {
  private router = inject(Router);
  navLinks: NavItem[] = [];

  dropdowns = signal<{label: string, active: boolean}[]>([])

  ngOnInit(): void {
    const finalLinks: NavItem[] = [];

    // Vasculha o primeiro nível das configurações de rotas
    this.router.config.forEach(route => {
      if (route.data && route.data['showInMenu']) {

        // Verifica se a flag 'childrenOnly' está ativa na rota
        if (route.data['childrenOnly'] && route.children) {
          const mappedChildren = this.mapRoutes(route.children, `/${route.path}`);
          finalLinks.push(...mappedChildren);
        } else {
          const mappedRoute = this.mapRoutes([route]);
          finalLinks.push(...mappedRoute);
        }

      }
    });

    this.navLinks = finalLinks;
  }

  mapRoutes(routes: Route[], parentPath: string = ''): NavItem[] {
    const items: NavItem[] = [];

    routes.forEach(route => {
      // Pula rotas de redirecionamento imediato e caminhos vazios
      if (route.redirectTo !== undefined || route.path === '') {
        return;
      }

      // Previne acúmulo incorreto de barras na URL final
      const currentPath = `${parentPath}/${route.path}`.replace(/\/+/g, '/');
      const data = route.data || {};

      if (data['linkType'] === 'dropdown' && route.children) {
        const dropdownItems = this.mapRoutes(route.children, currentPath) as NavLink[];

        const dropdown: NavDropDown = {
          label: data['label'] || route.path || '',
          icon: data['icon'] || '',
          items: dropdownItems
        };
        this.dropdowns.update((value) => [...value, {label: dropdown.label, active: false}]);
        items.push(dropdown);
      } else {
        const link: NavLink = {
          label: data['label'] || route.path || '',
          icon: data['icon'] || '',
          path: currentPath
        };
        items.push(link);
      }
    });

    return items;
  }
}
