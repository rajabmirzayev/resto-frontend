import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../customer';
import type { CreateCustomerOrderRequest, RequestBillRequest } from '../types';

export const customerKeys = {
  all: ['customer'] as const,
  menu: (orgId?: string) => [...customerKeys.all, 'menu', orgId ?? ''] as const,
  tables: (orgId?: string) => [...customerKeys.all, 'tables', orgId ?? ''] as const,
  order: (id: string) => [...customerKeys.all, 'order', id] as const,
};

export function useCustomerMenu(orgId?: string) {
  return useQuery({
    queryKey: customerKeys.menu(orgId),
    queryFn: async () => {
      const res = await customerApi.menu(orgId as string);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useCustomerTables(orgId?: string) {
  return useQuery({
    queryKey: customerKeys.tables(orgId),
    queryFn: async () => {
      const res = await customerApi.tables(orgId as string);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useCreateCustomerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerOrderRequest) => customerApi.createOrder(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(customerKeys.order(res.data.id), res.data);
    },
  });
}

export function useGetCustomerOrder(orderId: string | null, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: customerKeys.order(orderId ?? ''),
    queryFn: async () => {
      const res = await customerApi.getOrder(orderId as string);
      return res.data;
    },
    enabled: !!orderId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useRequestCustomerBill(orderId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestBillRequest) => customerApi.requestBill(orderId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.order(orderId ?? '') });
    },
  });
}
