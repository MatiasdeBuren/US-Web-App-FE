import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, Building2, Layers, Tag, Pencil, Lock } from 'lucide-react';
import { updateExpense, type Expense, type ExpenseType } from '../api_calls/expenses';
import { formatCurrency } from '../utils/expensesHelpers';
import type { LineItemForm } from './CreateExpenseModal';
import LineItemTypePickerModal from './LineItemTypePickerModal';
import LineItemSubtypePickerModal from './LineItemSubtypePickerModal';

export interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdited: (updated: Expense) => void;
  token: string;
  expense: Expense;
  expenseTypes: ExpenseType[];
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  onEdited,
  token,
  expense,
  expenseTypes,
}: EditExpenseModalProps) {
  const [period, setPeriod] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [typePickerIndex, setTypePickerIndex] = useState<number | null>(null);
  const [subtypePickerIndex, setSubtypePickerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && expense) {
      setPeriod(expense.period.substring(0, 7));
      setDueDate(expense.dueDate.substring(0, 10));
      setAdminNotes(expense.adminNotes ?? '');
      setLineItems(
        expense.lineItems.map((li) => ({
          typeId: li.typeId,
          subtypeId: li.subtypeId ?? null,
          description: li.description ?? '',
          amount: String(li.amount),
        }))
      );
      setError('');
      setSubmitted(false);
    }
  }, [isOpen, expense]);

  const addLineItem = () =>
    setLineItems((prev) => [...prev, { typeId: 0, subtypeId: null, description: '', amount: '' }]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string | number | null) =>
    setLineItems((prev) =>
      prev.map((li, i) =>
        i === index
          ? { ...li, [field]: value, ...(field === 'typeId' ? { subtypeId: null } : {}) }
          : li
      )
    );

  const isPaid = expense.status?.name === 'pagado';

  const totalPreview = lineItems.reduce((sum, li) => {
    const v = parseFloat(li.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    if (!period) return setError('Seleccione el período.');
    if (!dueDate) return setError('Ingrese la fecha de vencimiento.');
    if (lineItems.length === 0) return setError('Debe haber al menos un rubro.');
    if (lineItems.some((li) => !li.typeId))
      return setError('Todos los rubros deben tener un tipo seleccionado.');
    if (
      lineItems.some((li) => {
        const t = expenseTypes.find((t) => t.id === li.typeId);
        return t && (t.subtypes?.length ?? 0) > 0 && li.subtypeId === null;
      })
    )
      return setError('Los rubros con subrubros deben tener uno seleccionado.');
    if (lineItems.some((li) => !li.amount || parseFloat(li.amount) <= 0))
      return setError('Todos los rubros deben tener un importe mayor a 0.');
    if (lineItems.some((li) => parseFloat(li.amount) > 10_000_000))
      return setError('El importe de cada rubro no puede superar $ 10.000.000.');
    setSaving(true);
    try {
      const [year, month] = period.split('-').map(Number);
      const periodDate = new Date(year, month - 1, 1).toISOString();

      const updated = await updateExpense(token, expense.id, {
        period: periodDate,
        dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
        adminNotes: adminNotes || null,
        lineItems: lineItems.map((li) => ({
          typeId: li.typeId,
          subtypeId: li.subtypeId ?? null,
          description: li.description || null,
          amount: parseFloat(li.amount),
        })),
      });

      onEdited(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la expensa');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Editar Expensa</h3>
              <p className="text-sm text-gray-500">
                {expense.apartment
                  ? `Depto. ${expense.apartment.unit} — Piso ${expense.apartment.floor}`
                  : '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Apartment info — read only */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              {expense.apartment
                ? `Unidad ${expense.apartment.unit} — Piso ${expense.apartment.floor}`
                : 'Sin departamento'}
            </span>
            <span className="ml-auto text-xs text-gray-400">No editable</span>
          </div>

          {/* Period + Due date */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Paid notice */}
          {isPaid && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 flex-shrink-0" />
              Los importes no pueden modificarse porque la expensa ya fue <strong>pagada</strong>.
            </div>
          )}

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Rubros <span className="text-red-500">*</span>
              </label>
              {!isPaid && (
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar gasto
                </button>
              )}
            </div>

            <div className="space-y-3">
              {lineItems.map((li, i) => {
                const selectedType = expenseTypes.find((t) => t.id === li.typeId);
                const subtypes = selectedType?.subtypes ?? [];
                const typeError = submitted && li.typeId === 0;
                const subtypeError = submitted && subtypes.length > 0 && li.subtypeId === null;

                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Type picker */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tipo <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setTypePickerIndex(i)}
                          className={`w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                            typeError
                              ? 'border-red-300 bg-red-50 text-red-400 ring-1 ring-red-200'
                              : li.typeId !== 0
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                              : 'border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/40'
                          }`}
                        >
                          <Layers className={`w-4 h-4 flex-shrink-0 ${typeError ? 'text-red-400' : li.typeId !== 0 ? 'text-indigo-500' : 'text-gray-400'}`} />
                          <span className="truncate">
                            {li.typeId !== 0
                              ? expenseTypes.find((t) => t.id === li.typeId)?.label ?? 'Seleccionar tipo…'
                              : 'Seleccionar tipo…'}
                          </span>
                        </button>
                      </div>

                      {/* Subtype picker */}
                      {subtypes.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Subrubro <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setSubtypePickerIndex(i)}
                            className={`w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                              subtypeError
                                ? 'border-red-300 bg-red-50 text-red-400 ring-1 ring-red-200'
                                : li.subtypeId !== null
                                ? 'border-violet-300 bg-violet-50 text-violet-800'
                                : 'border-gray-200 bg-white text-gray-400 hover:border-violet-300 hover:bg-violet-50/40'
                            }`}
                          >
                            <Tag className={`w-4 h-4 flex-shrink-0 ${subtypeError ? 'text-red-400' : li.subtypeId !== null ? 'text-violet-500' : 'text-gray-400'}`} />
                            <span className="truncate">
                              {li.subtypeId !== null
                                ? subtypes.find((s) => s.id === li.subtypeId)?.label ?? 'Seleccionar subrubro…'
                                : 'Seleccionar subrubro…'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Description */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Descripción (opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Factura N° 1234"
                          value={li.description}
                          onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Importe (ARS) <span className="text-red-500">*</span>
                          {isPaid && <Lock className="inline-block w-3 h-3 ml-1 text-amber-500" />}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={10_000_000}
                            step="0.01"
                            placeholder="0.00"
                            value={li.amount}
                            onChange={(e) => !isPaid && updateLineItem(i, 'amount', e.target.value)}
                            disabled={isPaid}
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                              isPaid
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200'
                            }`}
                            required
                          />
                          {lineItems.length > 1 && !isPaid && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(i)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total preview */}
            <div className="mt-3 flex items-center justify-between px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-sm font-medium text-indigo-700">Total calculado</span>
              <span className="text-base font-bold text-indigo-900">{formatCurrency(totalPreview)}</span>
            </div>
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas administrativas (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Observaciones internas…"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
          <div className="flex justify-end gap-3 pt-2">
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
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <LineItemTypePickerModal
        isVisible={typePickerIndex !== null}
        onClose={() => setTypePickerIndex(null)}
        onSelect={(type) => {
          if (typePickerIndex !== null) updateLineItem(typePickerIndex, 'typeId', type.id);
          setTypePickerIndex(null);
        }}
        selectedId={typePickerIndex !== null ? lineItems[typePickerIndex].typeId : 0}
        types={expenseTypes}
        usedTypeIds={
          typePickerIndex !== null
            ? lineItems
                .filter((_, j) => j !== typePickerIndex)
                .map((li) => li.typeId)
                .filter((id) => id !== 0 && (expenseTypes.find((t) => t.id === id)?.subtypes?.length ?? 0) === 0)
            : []
        }
      />
      <LineItemSubtypePickerModal
        isVisible={subtypePickerIndex !== null}
        onClose={() => setSubtypePickerIndex(null)}
        onSelect={(subtype) => {
          if (subtypePickerIndex !== null) updateLineItem(subtypePickerIndex, 'subtypeId', subtype?.id ?? null);
          setSubtypePickerIndex(null);
        }}
        selectedId={subtypePickerIndex !== null ? lineItems[subtypePickerIndex].subtypeId : null}
        subtypes={
          subtypePickerIndex !== null
            ? (expenseTypes.find((t) => t.id === lineItems[subtypePickerIndex].typeId)?.subtypes ?? [])
            : []
        }
        typeName={
          subtypePickerIndex !== null
            ? (expenseTypes.find((t) => t.id === lineItems[subtypePickerIndex].typeId)?.label ?? '')
            : ''
        }
        usedSubtypeIds={
          subtypePickerIndex !== null
            ? lineItems
                .filter((_, j) => j !== subtypePickerIndex && lineItems[j].typeId === lineItems[subtypePickerIndex].typeId && lineItems[j].subtypeId !== null)
                .map((li) => li.subtypeId as number)
            : []
        }
      />
    </div>
  );
}
