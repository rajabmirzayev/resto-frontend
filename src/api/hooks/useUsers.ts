import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../user';
import type { CreateUserRequest, UpdateUserRequest } from '../types';

export const userKeys = {
  all: ['users'] as const,
  list: (orgId?: string) => [...userKeys.all, 'list', orgId ?? ''] as const,
  staffPerformance: (orgId?: string) => [...userKeys.all, 'staff-performance', orgId ?? ''] as const,
};

export function useUsers(orgId?: string) {
  return useQuery({
    queryKey: userKeys.list(orgId),
    queryFn: async () => {
      const res = await userApi.list(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useStaffPerformance(orgId?: string) {
  return useQuery({
    queryKey: userKeys.staffPerformance(orgId),
    queryFn: async () => {
      const res = await userApi.staffPerformance(orgId ? { orgId } : {});
      return res.data;
    },
  });
}

export function useCreateUser(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => userApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list(orgId) });
    },
  });
}

export function useUpdateUser(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) => userApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list(orgId) });
    },
  });
}

export function useDeleteUser(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list(orgId) });
    },
  });
}
