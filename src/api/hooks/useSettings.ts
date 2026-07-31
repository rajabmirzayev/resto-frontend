import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingApi } from '../setting';
import type { OrgSettingDto } from '../types';

export const settingsKeys = {
  all: ['settings'] as const,
  org: (orgId?: string) => [...settingsKeys.all, orgId ?? ''] as const,
};

export function useOrgSettings(orgId?: string) {
  return useQuery({
    queryKey: settingsKeys.org(orgId),
    queryFn: async () => {
      const res = await settingApi.get(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrgSettings(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrgSettingDto) => settingApi.update(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(settingsKeys.org(orgId), res.data);
    },
  });
}
