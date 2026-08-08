import { LayoutDashboard, UtensilsCrossed, ChefHat, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { UiScope } from '../api/types';

export interface PanelMeta {
  icon: LucideIcon;
  labelKey: string;
  iconBg: string;
  iconColor: string;
  badgeCls: string;
}

export const panelMeta: Record<UiScope, PanelMeta> = {
  SUPER_ADMIN_PANEL: {
    icon: ShieldCheck,
    labelKey: 'roles.panel_super_admin',
    iconBg: 'bg-danger-50',
    iconColor: 'text-danger-600',
    badgeCls: 'bg-danger-50 text-danger-600',
  },
  ADMIN_PANEL: {
    icon: LayoutDashboard,
    labelKey: 'roles.panel_admin',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    badgeCls: 'bg-primary-50 text-primary-600',
  },
  WAITER_PANEL: {
    icon: UtensilsCrossed,
    labelKey: 'roles.panel_waiter',
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
    badgeCls: 'bg-warning-50 text-warning-600',
  },
  KITCHEN_PANEL: {
    icon: ChefHat,
    labelKey: 'roles.panel_kitchen',
    iconBg: 'bg-success-50',
    iconColor: 'text-success-600',
    badgeCls: 'bg-success-50 text-success-600',
  },
};

export function getPanelMeta(scope: UiScope | string | null | undefined): PanelMeta {
  if (scope && scope in panelMeta) return panelMeta[scope as UiScope];
  return panelMeta.ADMIN_PANEL;
}
