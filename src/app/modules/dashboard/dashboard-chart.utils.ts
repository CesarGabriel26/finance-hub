import type { ChartConfiguration, ChartOptions, TooltipItem } from 'chart.js';
import type { CategoryAmountRow, TrendPoint } from './dashboard.utils';

export const DASHBOARD_CHART_PALETTE = [
  '#1f7ae0',
  '#169b62',
  '#dc3d35',
  '#f5b70a',
  '#6f58c9',
  '#0ea5e9',
  '#14b8a6',
  '#ef4444',
];

export function buildTrendChartConfig(points: TrendPoint[]): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data: {
      labels: points.map(point => point.label),
      datasets: [
        {
          label: 'Despesas',
          data: points.map(point => point.expense),
          borderColor: '#dc3d35',
          backgroundColor: 'rgba(220, 61, 53, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: 'Receitas',
          data: points.map(point => point.income),
          borderColor: '#169b62',
          backgroundColor: 'rgba(22, 155, 98, 0.10)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    },
    options: lineChartOptions(),
  };
}

export function buildCategoryDoughnutChartConfig(
  rows: CategoryAmountRow[],
): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data: {
      labels: rows.map(row => row.category?.name ?? 'Sem categoria'),
      datasets: [{
        data: rows.map(row => row.amount),
        backgroundColor: rows.map((row, index) =>
          row.category?.color ?? DASHBOARD_CHART_PALETTE[index % DASHBOARD_CHART_PALETTE.length]
        ),
        borderWidth: 0,
      }],
    },
    options: doughnutChartOptions(),
  };
}

function lineChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => formatCompactCurrency(Number(value)),
        },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
      },
      x: { grid: { display: false } },
    },
  };
}

function doughnutChartOptions(): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            return `${context.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
  };
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCompactCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}
