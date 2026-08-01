import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../menu';
import type { CreateMenuCategoryRequest, CreateMenuItemRequest, DeleteMenuCategoryRequest, UpdateMenuCategoryRequest, UpdateMenuItemRequest } from '../types';

export const menuKeys = {
  all: ['menu'] as const,
  items: (orgId?: string) => [...menuKeys.all, 'items', orgId ?? ''] as const,
  categories: (orgId?: string) => [...menuKeys.all, 'categories', orgId ?? ''] as const,
};

export function useMenuItems(orgId?: string) {
  return useQuery({
    queryKey: menuKeys.items(orgId),
    queryFn: async () => {
      const res = await menuApi.items(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useMenuCategories(orgId?: string) {
  return useQuery({
    queryKey: menuKeys.categories(orgId),
    queryFn: async () => {
      const res = await menuApi.categories(orgId ? { orgId } : undefined);
      return res.data;
    },
    enabled: !!orgId,
  });
}

export function useCreateMenuItem(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuItemRequest) => menuApi.createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.items(orgId) });
    },
  });
}

export function useUpdateMenuItem(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuItemRequest }) => menuApi.updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.items(orgId) });
    },
  });
}

export function useDeleteMenuItem(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.items(orgId) });
    },
  });
}

export function useUploadItemImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => menuApi.uploadItemImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

export function useDeleteItemImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuApi.removeItemImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}

export function useCreateMenuCategory(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuCategoryRequest) => menuApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories(orgId) });
    },
  });
}

export function useUpdateMenuCategory(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuCategoryRequest }) => menuApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories(orgId) });
    },
  });
}

export function useDeleteMenuCategory(_orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: DeleteMenuCategoryRequest }) => menuApi.removeCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
}
