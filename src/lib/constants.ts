import type { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Gözləyir',
  confirmed: 'Təsdiqlənib',
  preparing: 'Hazırlanır',
  ready: 'Hazırdır',
  served: 'Verilib',
  completed: 'Tamamlanıb',
  cancelled: 'Ləğv edilib',
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-warning-50 text-warning-600',
  confirmed: 'bg-primary-50 text-primary-600',
  preparing: 'bg-primary-50 text-primary-700',
  ready: 'bg-success-50 text-success-600',
  served: 'bg-success-50 text-success-600',
  completed: 'bg-surface-secondary text-text-muted',
  cancelled: 'bg-danger-50 text-danger-600',
};

export const ORDER_ITEM_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Gözləyir', color: 'bg-warning-50 text-warning-600' },
  confirmed: { label: 'Təsdiqlənib', color: 'bg-primary-50 text-primary-600' },
  preparing: { label: 'Hazırlanır', color: 'bg-primary-50 text-primary-700' },
  ready: { label: 'Hazırdır', color: 'bg-success-50 text-success-600' },
  served: { label: 'Verilib', color: 'bg-success-50 text-success-600' },
  completed: { label: 'Tamamlanıb', color: 'bg-surface-secondary text-text-muted' },
  cancelled: { label: 'Ləğv', color: 'bg-danger-50 text-danger-600' },
};
