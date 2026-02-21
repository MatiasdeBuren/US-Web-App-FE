import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, DollarSign, AlertCircle, ChevronDown,
  CreditCard, Banknote, Wallet, Building2, HelpCircle, CheckCircle,
} from 'lucide-react';
import { registerExpensePayment, type Expense, type PaymentMethod } from '../api_calls/expenses';
import { formatCurrency, formatPeriod } from '../utils/expensesHelpers';

// ─── Icon helper for payment methods ─────────────────────────────────────────
function getMethodIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('transferencia')) return Building2;
  if (l.includes('tarjeta') || l.includes('débito') || l.includes('crédito')) return CreditCard;
  if (l.includes('efectivo')) return Banknote;
  if (l.includes('sin') || l === '') return HelpCircle;
  return Wallet;
}

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
  const [methodId, setMethodId] = useState<number | ''>('');
  const [methodOpen, setMethodOpen] = useState(false);
  const [paidAt, setPaidAt] = useState('');
  const [notes, setNotes] = useState('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const methodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && expense) {
      const rem = expense.totalAmount - expense.paidAmount;
      setMethodId('');
      setMethodOpen(false);
      setPaidAt(new Date().toISOString().split('T')[0]);
      setNotes('');
      setCustomAmount(String(rem));
      setError('');
    }
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;

  const remaining = expense.totalAmount - expense.paidAmount;
  const selectedMethod = paymentMethods.find((m) => m.id === methodId) ?? null;
  const MethodIcon = selectedMethod ? getMethodIcon(selectedMethod.label) : HelpCircle;

  const parsedAmount = parseFloat(customAmount.replace(',', '.'));
  const amountIsValid =
    !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= remaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amountIsValid) {
      setError(`El importe debe ser mayor a $0 y no superar el pendiente (${formatCurrency(remaining)}).`);
      return;
    }
    setSaving(true);
    try {
      // Build a local-time ISO string from the date input (avoids UTC offset issues)
      const paidAtISO = paidAt
        ? new Date(`${paidAt}T12:00:00`).toISOString()
        : undefined;

      const updated = await registerExpensePayment(token, expense.id, {
        amount: parsedAmount,
        paymentMethodId: methodId ? Number(methodId) : null,
        paidAt: paidAtISO,
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient Header ── */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-6 pt-6 pb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Pago</h3>
                <p className="text-sm text-emerald-100 mt-0.5">
                  {expense.apartment
                    ? `Depto. ${expense.apartment.unit} — ${formatPeriod(expense.period)}`
                    : expense.user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer mt-0.5"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Balance strip */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: 'Total', value: formatCurrency(expense.totalAmount), cls: 'text-white' },
              { label: 'Pagado', value: formatCurrency(expense.paidAmount), cls: 'text-emerald-100' },
              { label: 'Pendiente', value: formatCurrency(remaining), cls: 'text-white font-bold' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                <p className="text-xs text-emerald-200 mb-1">{label}</p>
                <p className={`text-sm ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 -mt-4">
          {/* Amount — editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Importe a acreditar{' '}
              <span className="text-gray-400 font-normal">(ARS — máx. {formatCurrency(remaining)})</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="1"
                max={remaining}
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold outline-none transition-all ${
                  customAmount !== '' && !amountIsValid
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-400/20'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {customAmount !== '' && amountIsValid && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              )}
            </div>
            {customAmount !== '' && !amountIsValid && (
              <p className="mt-1 text-xs text-red-500">
                Ingresá un importe entre $1 y {formatCurrency(remaining)}.
              </p>
            )}
          </div>

          {/* Payment method — custom dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Método de pago</label>
            <div className="relative" ref={methodRef}>
              <button
                type="button"
                onClick={() => setMethodOpen((o) => !o)}
                className={`w-full px-4 py-2.5 text-left border rounded-xl transition-all duration-200 flex items-center justify-between bg-white cursor-pointer ${
                  methodOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MethodIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className={`text-sm ${selectedMethod ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedMethod ? selectedMethod.label : 'Sin especificar'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    methodOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {methodOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMethodOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
                    >
                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={() => { setMethodId(''); setMethodOpen(false); }}
                          className={`w-full px-3 py-2.5 text-left rounded-lg transition-colors flex items-center gap-2.5 ${
                            methodId === '' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          <HelpCircle className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span className="text-sm">Sin especificar</span>
                          {methodId === '' && <CheckCircle className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                        </button>

                        {paymentMethods.map((m) => {
                          const Icon = getMethodIcon(m.label);
                          const isSelected = methodId === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setMethodId(m.id); setMethodOpen(false); }}
                              className={`w-full px-3 py-2.5 text-left rounded-lg transition-colors flex items-center gap-2.5 ${
                                isSelected ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-emerald-500' : 'text-gray-400'}`} />
                              <span className="text-sm">{m.label}</span>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Payment date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha del pago</label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej: N° de comprobante"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Error */}
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
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
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
