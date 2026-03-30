import { Injectable, isDevMode } from '@angular/core';
import { DialogService } from './dialog.service';
import { Capacitor } from '@capacitor/core';
import { mobileApi } from './mobile-api';
import { MobileSqliteService, setMobileSqliteService } from './mobile-sqlite.service';

/**
 * DatabaseService (Centralized Base Service)
 * 
 * This service is responsible for:
 * 1. Providing a centralized entry point for calling backend IPC APIs (Electron window.api).
 * 2. Standardizing error handling and user notifications for all database operations.
 * 3. Environment-aware API resolution (development vs production).
 * 
 * Domain-specific logic has been moved to:
 * - AccountService, CategoryService, MovementService, BillService, 
 *   InvestmentService, DashboardService, KeywordService
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(
    private dialog: DialogService,
    private mobileSqlite: MobileSqliteService
  ) {
    // Inject the initial service instance to the exported helper
    if (Capacitor.isNativePlatform() || !(window as any).api) {
      setMobileSqliteService(this.mobileSqlite);
    }
  }

  /**
   * Universal wrapper for all IPC calls.
   * Centralizes error logging and user alerts.
   */
  async handleApi<T>(apiMethod: string, ...args: any[]): Promise<T> {
    try {
      if (Capacitor.isNativePlatform() || !(window as any).api) {
        // Run against local mobile SQLite
        const fn = (mobileApi as any)[apiMethod];
        if (typeof fn !== 'function') {
           throw new Error(`Mobile API method ${apiMethod} not found.`);
        }
        const result = await fn(...args);
        return result as T;
      } else {
        // Run against Electron IPC
        const api = (window as any).api;
        if (!api || typeof api[apiMethod] !== 'function') {
          throw new Error(`API method ${apiMethod} not found or window.api not available.`);
        }

        const result = await api[apiMethod](...args);
        return result as T;
      }
    } catch (error: any) {
      console.error(`Error calling API ${apiMethod}:`, error);
      
      let errorMsg = 'Ocorreu um erro ao processar sua solicitação.';
      
      // Attempt to extract meaningful error message
      if (typeof error === 'string') errorMsg = error;
      else if (error.message) errorMsg = error.message;

      // Notify user via centralized dialog system
      await this.dialog.error(errorMsg, 'Erro no Banco de Dados');
      
      throw error;
    }
  }

  // --- Core / Shared methods can stay here if they are truly universal ---

  isDev() {
    return isDevMode();
  }
}
