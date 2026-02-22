import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  Trash2,
  FileText,
  ChevronRight,
  ChevronUp,
  Receipt,
  Clock,
  X,
} from 'lucide-react';
import type { Expense } from '../api_calls/expenses';
import {
  STATUS_COLORS,
  STATUS_ICONS,
  TYPE_ICONS,
  formatCurrency,
  formatPeriod,
  formatDate,
  progressPercent,
} from '../utils/expensesHelpers';

export interface ExpenseCardProps {
  expense: Expense;
  onRegisterPayment: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onDeletePayment?: (expenseId: number, paymentId: number) => void;
  deletingPaymentIds?: Set<number>;
}

export default function ExpenseCard({ expense, onRegisterPayment, onDelete, onDeletePayment, deletingPaymentIds }: ExpenseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = STATUS_ICONS[expense.status?.name] ?? Clock;
  const pct = progressPercent(expense.paidAmount, expense.totalAmount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* ── Main row ── */}
      <div className="p-5">
        <div className="flex items-start gap-4">

          {/* Icon */}
          <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Receipt className="w-5 h-5 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Title: apartment / user + period */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {expense.apartment
                  ? `Depto. ${expense.apartment.unit} — Piso ${expense.apartment.floor}`
                  : expense.user
                  ? expense.user.name
                  : '—'}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 capitalize">
                {formatPeriod(expense.period)}
              </span>
            </div>

            {/* Status + due date */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  STATUS_COLORS[expense.status?.name] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {expense.status?.label ?? expense.status?.name}
              </span>

              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                Vence: {formatDate(expense.dueDate)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  Pagado:{' '}
                  <span className="font-medium text-gray-800">{formatCurrency(expense.paidAmount)}</span>
                </span>
                {expense.totalAmount - expense.paidAmount > 0 && (
                  <span>
                    Saldo:{' '}
                    <span className="font-medium text-red-600">{formatCurrency(expense.totalAmount - expense.paidAmount)}</span>
                  </span>
                )}
                <span>
                  Total:{' '}
                  <span className="font-medium text-gray-800">{formatCurrency(expense.totalAmount)}</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Line-item type badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Array.from(new Set(expense.lineItems.map((li) => li.type?.label))).map((label) => {
                const typeName = expense.lineItems.find((li) => li.type?.label === label)?.type?.name ?? '';
                const Icon = TYPE_ICONS[typeName] ?? FileText;
                return (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {expense.status?.name !== 'pagado' && (
                <button
                  onClick={() => onRegisterPayment(expense)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Registrar pago"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Registrar pago
                </button>
              )}
              <button
                onClick={() => onDelete(expense)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar expensa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              {expanded ? (
                <>Ocultar <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Ver detalle <ChevronRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 bg-gray-50 px-5 py-4 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-6">

              {/* Line items */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Rubros
                </h4>
                <div className="space-y-2">
                  {expense.lineItems.map((li) => {
                    const Icon = TYPE_ICONS[li.type?.name ?? ''] ?? FileText;
                    return (
                      <div key={li.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <span>
                            {li.subtype?.label
                              ? `${li.type?.label} — ${li.subtype?.label}`
                              : li.type?.label}
                            {li.description && (
                              <span className="text-gray-400 ml-1">({li.description})</span>
                            )}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 ml-4 flex-shrink-0">
                          {formatCurrency(li.amount)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(expense.totalAmount)}</span>
                  </div>
                  {expense.totalAmount - expense.paidAmount > 0 && (
                    <div className="flex items-center justify-between text-sm font-semibold text-red-600 mt-1">
                      <span>Saldo restante</span>
                      <span>{formatCurrency(expense.totalAmount - expense.paidAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment history */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Historial de pagos
                </h4>
                {expense.payments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin pagos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {expense.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-gray-700">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <div>
                            <span className="font-medium">{formatCurrency(p.amount)}</span>
                            {p.paymentMethod && (
                              <span className="text-gray-400 ml-1 text-xs">
                                vía {p.paymentMethod.label}
                              </span>
                            )}
                            <div className="text-xs text-gray-400">
                              {formatDate(p.paidAt)} · {p.registeredBy?.name}
                            </div>
                            {p.notes && (
                              <div className="text-xs text-gray-500 italic">{p.notes}</div>
                            )}
                          </div>
                        </div>
                        {onDeletePayment && (
                          <button
                            onClick={() => onDeletePayment(expense.id, p.id)}
                            disabled={deletingPaymentIds?.has(p.id)}
                            className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title="Eliminar pago"
                          >
                            {deletingPaymentIds?.has(p.id)
                              ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                              : <X className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin notes */}
                {expense.adminNotes && (
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Nota del administrador</p>
                    <p className="text-xs text-blue-700">{expense.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
