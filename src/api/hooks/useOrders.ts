import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../order';

export const orderKeys = {
  all: ['orders'] as const,
  list: (orgId?: string) => [...orderKeys.all, 'list', orgId ?? ''] as const,
};

export function useOrders(orgId?: string) {
  return useQuery({
    queryKey: orderKeys.list(orgId),
    queryFn: async () => {
      const res = await orderApi.list(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}
