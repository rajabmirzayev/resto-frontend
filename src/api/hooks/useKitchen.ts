import { useQuery } from '@tanstack/react-query';
import { kitchenApi } from '../kitchen';

export const kitchenKeys = {
  all: ['kitchen'] as const,
  orders: (orgId?: string) => [...kitchenKeys.all, 'orders', orgId ?? ''] as const,
};

export function useKitchenOrders(orgId?: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: kitchenKeys.orders(orgId),
    queryFn: async () => {
      const res = await kitchenApi.orders(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
    refetchInterval: options?.refetchInterval,
  });
}
