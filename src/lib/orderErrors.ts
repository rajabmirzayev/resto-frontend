import { ApiError } from '../api/client';
import type { I18nContextValue } from '../i18n';

type TFunction = I18nContextValue['t'];

export const ORDER_ERROR_KEYS: Record<string, string> = {
  ORDER_MS_1000: 'error.orders.validation',
  ORDER_MS_1003: 'error.orders.bad_request',
  ORDER_MS_3001: 'error.orders.order_not_found',
  ORDER_MS_4001: 'error.orders.invalid_status_transition',
  ORDER_MS_4004: 'error.orders.only_pending_confirmable',
  ORDER_MS_4005: 'error.orders.order_not_active',
  ORDER_MS_4006: 'error.orders.item_not_found',
  ORDER_MS_4007: 'error.orders.invalid_item_status',
  ORDER_MS_4008: 'error.orders.payment_already_completed',
  ORDER_MS_4009: 'error.orders.not_cancellable',
  ORDER_MS_4011: 'error.orders.table_not_available',
  ORDER_MS_4012: 'error.orders.menu_item_not_found',
  ORDER_MS_4013: 'error.orders.menu_item_not_available',
  WAITER_MS_3003: 'error.orders.access_denied',
  WAITER_MS_9001: 'error.orders.upstream_unavailable',
  WAITER_MS_9002: 'error.orders.upstream_error',
};

const TABLE_FALLBACK_KEYS: Record<string, string> = {
  TABLE_MS_1000: 'error.tables.validation',
  TABLE_MS_3001: 'error.tables.table_not_found',
  TABLE_MS_3003: 'error.tables.access_denied',
  TABLE_MS_2003: 'error.tables.invalid_status_transition',
  TABLE_MS_4003: 'error.tables.order_id_required',
};

export function getOrderErrorMessage(err: unknown, fallback: string, t: TFunction): string {
  if (err instanceof ApiError) {
    if (err.key && ORDER_ERROR_KEYS[err.key]) return t(ORDER_ERROR_KEYS[err.key]);
    if (err.key && TABLE_FALLBACK_KEYS[err.key]) return t(TABLE_FALLBACK_KEYS[err.key]);
    if (err.detail) return err.detail;
    return fallback;
  }
  return t('error.network');
}
