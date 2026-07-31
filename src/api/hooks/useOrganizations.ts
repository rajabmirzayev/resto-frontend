import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '../organization';
import type { CreateOrganizationRequest } from '../types';

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationKeys.all, 'list'] as const,
  detail: (orgId: string) => [...organizationKeys.all, 'detail', orgId] as const,
  qrCode: (orgId: string) => [...organizationKeys.detail(orgId), 'qr'] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: async () => {
      const res = await organizationApi.list();
      return res.data;
    },
  });
}

export function useOrganizationQrCode(orgId: string | null) {
  return useQuery({
    queryKey: organizationKeys.qrCode(orgId ?? ''),
    queryFn: async () => {
      const res = await organizationApi.getQrCode(orgId as string);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationRequest) => organizationApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
