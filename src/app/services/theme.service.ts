import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'finance-hub-theme';
  isDarkMode = signal<boolean>(true);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    
    // Default to dark if no preference is saved
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    
    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
  }

  toggleTheme() {
    const newMode = !this.isDarkMode();
    this.isDarkMode.set(newMode);
    this.applyTheme(newMode);
    localStorage.setItem(this.THEME_KEY, newMode ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }
}
