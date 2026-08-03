import type { RestaurantTableDto, TableStatusEnum } from '../api/types';

export const TABLE_STATUSES: readonly TableStatusEnum[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'];

export const ALLOWED_TRANSITIONS: Record<TableStatusEnum, readonly TableStatusEnum[]> = {
  AVAILABLE: ['AVAILABLE', 'OCCUPIED', 'CLEANING'],
  OCCUPIED: ['AVAILABLE', 'OCCUPIED', 'CLEANING'],
  RESERVED: ['OCCUPIED'],
  CLEANING: ['AVAILABLE', 'CLEANING'],
};

export function getStatusTargets(table: RestaurantTableDto): TableStatusEnum[] {
  return [...ALLOWED_TRANSITIONS[table.status]];
}

export function isStatusTransitionAllowed(current: TableStatusEnum, target: TableStatusEnum): boolean {
  return ALLOWED_TRANSITIONS[current].includes(target);
}
