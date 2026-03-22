import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, History, ChevronRight, Calendar, Tag } from 'lucide-angular';

@Component({
  selector: 'app-changelog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.css'
})
export class ChangelogComponent implements OnInit {
  readonly HistoryIcon = History;
  readonly ChevronRightIcon = ChevronRight;
  readonly CalendarIcon = Calendar;
  readonly TagIcon = Tag;

  changelogData = signal<any[]>([]);

  async ngOnInit() {
    try {
      const response = await fetch('assets/changelog.json');
      const data = await response.json();
      
      // Transform object to array and sort by version (descending)
      const sorted = Object.entries(data).map(([version, details]: [string, any]) => ({
        version,
        ...details
      })).sort((a, b) => {
        const vA = a.version.split('.').map(Number);
        const vB = b.version.split('.').map(Number);
        for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
          const numA = vA[i] || 0;
          const numB = vB[i] || 0;
          if (numA !== numB) return numB - numA;
        }
        return 0;
      });

      this.changelogData.set(sorted);
    } catch (error) {
      console.error('Erro ao carregar changelog:', error);
    }
  }
}
