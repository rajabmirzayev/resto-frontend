import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../role';
import type { CreateRoleRequest, UpdateRoleRequest } from '../types';

export const roleKeys = {
  all: ['roles'] as const,
  list: (orgId?: string) => [...roleKeys.all, 'list', orgId ?? ''] as const,
  detail: (id: string) => [...roleKeys.all, 'detail', id] as const,
};

export function useRoles(orgId?: string) {
  return useQuery({
    queryKey: roleKeys.list(orgId),
    queryFn: async () => {
      const res = await roleApi.list(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useCreateRole(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoleRequest) => roleApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(orgId) });
    },
  });
}

export function useUpdateRole(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoleRequest }) => roleApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(orgId) });
    },
  });
}

export function useDeleteRole(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list(orgId) });
    },
  });
}
