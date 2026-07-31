import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (orgId?: string) => [...dashboardKeys.all, 'stats', orgId ?? ''] as const,
  topItems: (orgId?: string) => [...dashboardKeys.all, 'top-items', orgId ?? ''] as const,
  recentOrders: (orgId?: string) => [...dashboardKeys.all, 'recent-orders', orgId ?? ''] as const,
  staff: (orgId?: string) => [...dashboardKeys.all, 'staff', orgId ?? ''] as const,
};

export function useDashboardStats(orgId?: string) {
  return useQuery({
    queryKey: dashboardKeys.stats(orgId),
    queryFn: async () => {
      const res = await dashboardApi.stats(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useDashboardTopItems(orgId?: string) {
  return useQuery({
    queryKey: dashboardKeys.topItems(orgId),
    queryFn: async () => {
      const res = await dashboardApi.topItems(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useDashboardRecentOrders(orgId?: string) {
  return useQuery({
    queryKey: dashboardKeys.recentOrders(orgId),
    queryFn: async () => {
      const res = await dashboardApi.recentOrders(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}

export function useDashboardStaff(orgId?: string) {
  return useQuery({
    queryKey: dashboardKeys.staff(orgId),
    queryFn: async () => {
      const res = await dashboardApi.staffList(orgId ? { orgId } : undefined);
      return res.data;
    },
  });
}
