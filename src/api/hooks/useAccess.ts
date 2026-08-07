import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accessApi } from '../access';
import type {
  AssignUsersRequest,
  CreateRoleRequest,
  CreateUserRequest,
  UpdateRoleRequest,
  UpdateUserRequest,
  SetPermissionsRequest,
} from '../types';

// ===== User keys =====

export const userKeys = {
  all: ['users'] as const,
  list: (params?: { orgId?: string; roleId?: string; page?: number }) => ['users', 'list', params] as const,
  staffPerformance: (orgId?: string) => ['users', 'staff-performance', orgId ?? ''] as const,
};

export function useUsers(params?: { orgId?: string; roleId?: string; page?: number }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const res = await accessApi.listUsers(params);
      return res.data;
    },
  });
}

export function useStaffPerformance(orgId?: string) {
  return useQuery({
    queryKey: userKeys.staffPerformance(orgId),
    queryFn: async () => {
      const res = await accessApi.staffPerformance(orgId ? { orgId } : {});
      return res.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => accessApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) => accessApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accessApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ===== Role keys =====

export const roleKeys = {
  all: ['roles'] as const,
  list: (params?: { page?: number }) => ['roles', 'list', params] as const,
  detail: (id: string) => ['roles', 'detail', id] as const,
  tree: ['roles', 'permissions-tree'] as const,
};

export function useRoles(params?: { page?: number }) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: async () => {
      const res = await accessApi.listRoles(params);
      return res.data;
    },
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const res = await accessApi.getRole(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePermissionsTree() {
  return useQuery({
    queryKey: roleKeys.tree,
    queryFn: async () => {
      const res = await accessApi.permissionsTree();
      return res.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoleRequest) => accessApi.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoleRequest }) => accessApi.updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accessApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useSetRolePermissions(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetPermissionsRequest) => accessApi.setRolePermissions(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAssignRoleUsers(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignUsersRequest) => accessApi.assignRoleUsers(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
