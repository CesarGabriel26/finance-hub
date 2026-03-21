const fs = require('fs');
let code = fs.readFileSync('src/app/services/database.service.ts', 'utf8');

code = code.replace(/import { Injectable } from '@angular\/core';/, 
  "import { Injectable, inject } from '@angular/core';\nimport { ToastService } from './toast.service';");

code = code.replace(/recategorizeMovements: \(\) => Promise<{ updatedCount: number }>;\n    };\n  }\n}/, 
  "recategorizeMovements: () => Promise<{ updatedCount: number }>;\n      getDashboardData: (period: string) => Promise<any[]>;\n      getDashboardEvolution: (periods: string[]) => Promise<any[]>;\n    };\n  }\n}");

code = code.replace(/export class DatabaseService {\n\n  constructor\(\) { }/, 
  "export class DatabaseService {\n\n  toastService = inject(ToastService);\n\n  constructor() { }\n\n  private async handleApi<T>(apiPromise: Promise<T>): Promise<T> {\n    try {\n      return await apiPromise;\n    } catch (err: any) {\n      console.error(err);\n      this.toastService.error(err.message || 'Erro ao comunicar com o servidor');\n      throw err;\n    }\n  }\n\n  async getDashboardData(period: string): Promise<any[]> {\n    return this.handleApi(window.api.getDashboardData(period));\n  }\n\n  async getDashboardEvolution(periods: string[]): Promise<any[]> {\n    return this.handleApi(window.api.getDashboardEvolution(periods));\n  }");

code = code.replace(/return window\.api\.([a-zA-Z0-9_]+)\((.*?)\);/g, (match, methodName, args) => {
  return "return this.handleApi(" + match.slice(0, -1) + ");";
});

fs.writeFileSync('src/app/services/database.service.ts', code);
console.log("DatabaseService updated!");
