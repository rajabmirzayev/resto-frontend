import { useQuery } from '@tanstack/react-query';
import { tableApi } from '../table';

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
  });
}

export function useTableSections(orgId?: string) {
  return useQuery({
    queryKey: tableKeys.sections(orgId),
    queryFn: async () => {
      const res = await tableApi.sections(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}
