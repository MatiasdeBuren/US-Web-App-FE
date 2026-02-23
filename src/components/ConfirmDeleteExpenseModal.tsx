import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Expense } from '../api_calls/expenses';
import { formatCurrency, formatPeriod } from '../utils/expensesHelpers';

export interface ConfirmDeleteExpenseModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}


export default function ConfirmDeleteExpenseModal({
  isOpen,
  expense,
  onClose,
  onConfirm,
  isDeleting,
}: ConfirmDeleteExpenseModalProps) {
  if (!isOpen || !expense) return null;

  const expenseName = expense.apartment
    ? `Depto. ${expense.apartment.unit}`
    : '—';

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Eliminar expensa</h3>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {/* Confirmation message */}
        <p className="text-sm text-gray-600 mb-5">
          ¿Confirmás la eliminación de la expensa de{' '}
          <strong>{expenseName}</strong> correspondiente a{' '}
          <strong className="capitalize">{formatPeriod(expense.period)}</strong> por{' '}
          <strong>{formatCurrency(expense.totalAmount)}</strong>?
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
