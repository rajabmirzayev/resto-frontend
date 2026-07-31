import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tableApi } from '../table';
import type { CreateSectionRequest, CreateTableRequest, TableStatusEnum, UpdateReservationRequest, UpdateTableRequest } from '../types';

export const tableKeys = {
  all: ['tables'] as const,
  list: (orgId?: string) => [...tableKeys.all, 'list', orgId ?? ''] as const,
  sections: (orgId?: string) => [...tableKeys.all, 'sections', orgId ?? ''] as const,
};

export function useTables(orgId?: string) {
  return useQuery({
    queryKey: tableKeys.list(orgId),
    queryFn: async () => {
      const res = await tableApi.list(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useTableSections(orgId?: string) {
  return useQuery({
    queryKey: tableKeys.sections(orgId),
    queryFn: async () => {
      const res = await tableApi.sections(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useCreateTable(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTableRequest) => tableApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(orgId) });
    },
  });
}

export function useUpdateTable(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTableRequest }) => tableApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(orgId) });
    },
  });
}

export function useDeleteTable(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tableApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(orgId) });
    },
  });
}

export function useUpdateTableStatus(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatusEnum }) => tableApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(orgId) });
    },
  });
}

export function useUpdateReservation(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reservation }: { id: string; reservation: UpdateReservationRequest }) => tableApi.updateReservation(id, reservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(orgId) });
    },
  });
}

export function useRemoveReservation(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tableApi.removeReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.list(orgId) });
    },
  });
}

export function useCreateSection(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionRequest) => tableApi.createSection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.sections(orgId) });
    },
  });
}

export function useUpdateSection(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => tableApi.updateSection(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.sections(orgId) });
    },
  });
}

export function useRemoveSection(_orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tableApi.removeSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}
