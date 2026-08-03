import { ApiError } from '../api/client';
import type { I18nContextValue } from '../i18n';

type TFunction = I18nContextValue['t'];

export const TABLE_ERROR_KEYS: Record<string, string> = {
  TABLE_MS_1000: 'error.tables.validation',
  TABLE_MS_3001: 'error.tables.table_not_found',
  TABLE_MS_3002: 'error.tables.section_not_found',
  TABLE_MS_3003: 'error.tables.access_denied',
  TABLE_MS_2001: 'error.tables.has_active_order',
  TABLE_MS_2002: 'error.tables.last_section',
  TABLE_MS_2003: 'error.tables.invalid_status_transition',
  TABLE_MS_2004: 'error.tables.occupied_reservation',
  TABLE_MS_2005: 'error.tables.upcoming_reservation',
  TABLE_MS_3004: 'error.tables.table_number_exists',
  TABLE_MS_3005: 'error.tables.section_name_exists',
  TABLE_MS_4002: 'error.tables.guest_count_exceeds',
  TABLE_MS_4003: 'error.tables.order_id_required',
};

export function getTableErrorMessage(err: unknown, fallback: string, t: TFunction): string {
  if (err instanceof ApiError) {
    if (err.key && TABLE_ERROR_KEYS[err.key]) return t(TABLE_ERROR_KEYS[err.key]);
    if (err.detail) return err.detail;
    return fallback;
  }
  return t('error.network');
}
