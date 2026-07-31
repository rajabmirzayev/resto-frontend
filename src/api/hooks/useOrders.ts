import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../order';
import type { CreateOrderRequest, OrderItemPayload, OrderItemStatusEnum, OrderStatusEnum, PaymentMethodEnum } from '../types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (orgId?: string) => [...orderKeys.all, 'list', orgId ?? ''] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrders(orgId?: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: orderKeys.list(orgId),
    queryFn: async () => {
      const res = await orderApi.list(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: async () => {
      const res = await orderApi.get(id as string);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateOrder(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => orderApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useAddOrderItems(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: OrderItemPayload[] }) => orderApi.addItems(id, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useUpdateOrderStatus(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatusEnum }) => orderApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useUpdateOrderItemStatus(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId, status }: { orderId: string; itemId: string; status: OrderItemStatusEnum }) => orderApi.updateItemStatus(orderId, itemId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useWaiterConfirmOrder(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, waiterId, waiterName }: { id: string; waiterId: string; waiterName: string }) => orderApi.waiterConfirm(id, { waiterId, waiterName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useCancelOrder(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useCompletePayment(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderApi.completePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useRequestPayment(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, method }: { id: string; method: PaymentMethodEnum }) => orderApi.requestPayment(id, { method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useStartPreparingOrder(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderApi.startPreparing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}

export function useMarkAllReadyOrder(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderApi.markAllReady(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(orgId) });
    },
  });
}
