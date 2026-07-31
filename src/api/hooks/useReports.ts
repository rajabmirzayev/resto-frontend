import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../report';

export const reportKeys = {
  all: ['reports'] as const,
  summary: (orgId?: string) => [...reportKeys.all, 'summary', orgId ?? ''] as const,
  daily: (orgId?: string) => [...reportKeys.all, 'daily', orgId ?? ''] as const,
  hourly: (orgId?: string) => [...reportKeys.all, 'hourly', orgId ?? ''] as const,
  categories: (orgId?: string) => [...reportKeys.all, 'categories', orgId ?? ''] as const,
  topItems: (orgId?: string) => [...reportKeys.all, 'top-items', orgId ?? ''] as const,
  staff: (orgId?: string) => [...reportKeys.all, 'staff', orgId ?? ''] as const,
};

export function useReportSummary(orgId?: string) {
  return useQuery({
    queryKey: reportKeys.summary(orgId),
    queryFn: async () => {
      const res = await reportApi.summary(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useDailyRevenue(orgId?: string) {
  return useQuery({
    queryKey: reportKeys.daily(orgId),
    queryFn: async () => {
      const res = await reportApi.dailyRevenue(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useHourlyReport(orgId?: string) {
  return useQuery({
    queryKey: reportKeys.hourly(orgId),
    queryFn: async () => {
      const res = await reportApi.hourly(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useSalesByCategory(orgId?: string) {
  return useQuery({
    queryKey: reportKeys.categories(orgId),
    queryFn: async () => {
      const res = await reportApi.salesByCategory(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useTopItemsReport(orgId?: string) {
  return useQuery({
    queryKey: reportKeys.topItems(orgId),
    queryFn: async () => {
      const res = await reportApi.topItems(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useStaffPerformance(orgId?: string) {
  return useQuery({
    queryKey: reportKeys.staff(orgId),
    queryFn: async () => {
      const res = await reportApi.staffPerformance(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}
