import {
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  Droplets,
  Flame,
  Home,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  parcial: 'bg-blue-100 text-blue-800 border-blue-200',
  pagado: 'bg-green-100 text-green-800 border-green-200',
  vencido: 'bg-red-100 text-red-800 border-red-200',
};

export const STATUS_ICONS: Record<string, LucideIcon> = {
  pendiente: Clock,
  parcial: AlertCircle,
  pagado: CheckCircle,
  vencido: XCircle,
};

export const TYPE_ICONS: Record<string, LucideIcon> = {
  gastos_comunes: Building,
  luz: Zap,
  agua: Droplets,
  gas: Flame,
  alquiler: Home,
  otro: HelpCircle,
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPeriod(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function progressPercent(paid: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}
