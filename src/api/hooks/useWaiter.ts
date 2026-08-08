import { useQuery } from '@tanstack/react-query';
import { waiterApi } from '../waiter';

export const waiterKeys = {
  all: ['waiter'] as const,
  tables: (orgId?: string) => [...waiterKeys.all, 'tables', orgId ?? ''] as const,
  pendingConfirm: (orgId?: string) => [...waiterKeys.all, 'pending-confirm', orgId ?? ''] as const,
  paymentRequests: (orgId?: string) => [...waiterKeys.all, 'payment-requests', orgId ?? ''] as const,
};

export function useWaiterTables(orgId?: string) {
  return useQuery({
    queryKey: waiterKeys.tables(orgId),
    queryFn: async () => {
      const res = await waiterApi.tables(orgId ? { orgId } : undefined);
      return res.data.tables;
    },
    enabled: !!orgId,
  });
}

export function useWaiterPendingConfirm(orgId?: string) {
  return useQuery({
    queryKey: waiterKeys.pendingConfirm(orgId),
    queryFn: async () => {
      const res = await waiterApi.pendingConfirm(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useWaiterPaymentRequests(orgId?: string) {
  return useQuery({
    queryKey: waiterKeys.paymentRequests(orgId),
    queryFn: async () => {
      const res = await waiterApi.paymentRequests(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}
