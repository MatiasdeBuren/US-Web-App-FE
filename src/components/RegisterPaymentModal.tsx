import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, AlertCircle, ChevronDown } from 'lucide-react';
import { registerExpensePayment, type Expense, type PaymentMethod } from '../api_calls/expenses';
import { formatCurrency, formatPeriod } from '../utils/expensesHelpers';

export interface RegisterPaymentModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onClose: () => void;
  onRegistered: (updated: Expense) => void;
  token: string;
  paymentMethods: PaymentMethod[];
}

export default function RegisterPaymentModal({
  isOpen,
  expense,
  onClose,
  onRegistered,
  token,
  paymentMethods,
}: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState<number | ''>('');
  const [paidAt, setPaidAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill with the remaining balance when the modal opens
  useEffect(() => {
    if (isOpen && expense) {
      const remaining = expense.totalAmount - expense.paidAmount;
      setAmount(remaining > 0 ? String(remaining) : '');
      setMethodId('');
      setPaidAt(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;

  const remaining = expense.totalAmount - expense.paidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return setError('El importe debe ser mayor a 0.');
    if (amountNum > remaining + 0.01)
      return setError(`El importe supera el saldo pendiente (${formatCurrency(remaining)}).`);

    setSaving(true);
    try {
      const updated = await registerExpensePayment(token, expense.id, {
        amount: amountNum,
        paymentMethodId: methodId ? Number(methodId) : null,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        notes: notes || null,
      });
      onRegistered(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Registrar Pago</h3>
              <p className="text-sm text-gray-500">
                {expense.apartment
                  ? `Depto. ${expense.apartment.unit} — ${formatPeriod(expense.period)}`
                  : expense.user?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Balance summary */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(expense.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Pagado</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(expense.paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Pendiente</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(remaining)}</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importe a acreditar (ARS) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <div className="relative">
              <select
                value={methodId}
                onChange={(e) => setMethodId(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
              >
                <option value="">Sin especificar</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Payment date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del pago</label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              placeholder="Ej: N° de comprobante"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando…
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Confirmar pago
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
