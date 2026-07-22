import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastType } from '../../store/useToast';

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-primary-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className="bg-white dark:bg-surface rounded-xl shadow-2xl border border-border p-4 flex items-start gap-3 pointer-events-auto animate-[slideIn_0.3s_ease-out]"
          >
            <div className={`w-8 h-8 rounded-lg ${colorMap[toast.type]} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium text-text-primary flex-1 pt-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary text-xs flex-shrink-0 pt-1"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
