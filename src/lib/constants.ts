import type { OrderStatus } from '../types';

type TFunc = (key: string) => string;

export const getOrderStatusLabels = (t: TFunc): Record<OrderStatus, string> => ({
  pending: t('status.pending'),
  confirmed: t('status.confirmed'),
  preparing: t('status.preparing'),
  ready: t('status.ready'),
  served: t('status.served'),
  completed: t('status.completed'),
  cancelled: t('status.cancelled'),
});

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-warning-50 text-warning-600',
  confirmed: 'bg-primary-50 text-primary-600',
  preparing: 'bg-primary-50 text-primary-700',
  ready: 'bg-success-50 text-success-600',
  served: 'bg-success-50 text-success-600',
  completed: 'bg-surface-secondary text-text-muted',
  cancelled: 'bg-danger-50 text-danger-600',
};

export const getOrderItemStatusLabels = (t: TFunc): Record<string, { label: string; color: string }> => ({
  pending: { label: t('item_status.pending'), color: 'bg-warning-50 text-warning-600' },
  confirmed: { label: t('item_status.confirmed'), color: 'bg-primary-50 text-primary-600' },
  preparing: { label: t('item_status.preparing'), color: 'bg-primary-50 text-primary-700' },
  ready: { label: t('item_status.ready'), color: 'bg-success-50 text-success-600' },
  served: { label: t('item_status.served'), color: 'bg-success-50 text-success-600' },
  completed: { label: t('item_status.completed'), color: 'bg-surface-secondary text-text-muted' },
  cancelled: { label: t('item_status.cancelled'), color: 'bg-danger-50 text-danger-600' },
});
