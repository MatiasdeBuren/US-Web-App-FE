import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { createExpense, type ExpenseType, type CreateExpenseLineItemInput } from '../api_calls/expenses';
import { formatCurrency } from '../utils/expensesHelpers';

export interface LineItemForm {
  typeId: number;
  subtypeId: number | null;
  description: string;
  amount: string;
}

export interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  token: string;
  expenseTypes: ExpenseType[];
}

export default function CreateExpenseModal({
  isOpen,
  onClose,
  onCreated,
  token,
  expenseTypes,
}: CreateExpenseModalProps) {
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [period, setPeriod] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { typeId: 0, subtypeId: null, description: '', amount: '' },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setApartmentUnit('');
      const now = new Date();
      setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setDueDate('');
      setAdminNotes('');
      setLineItems([{ typeId: 0, subtypeId: null, description: '', amount: '' }]);
      setError('');
    }
  }, [isOpen]);

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

  const totalPreview = lineItems.reduce((sum, li) => {
    const v = parseFloat(li.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apartmentUnit.trim()) return setError('Ingrese la unidad del departamento.');
    if (!period) return setError('Seleccione el período.');
    if (!dueDate) return setError('Ingrese la fecha de vencimiento.');
    if (lineItems.some((li) => !li.typeId)) return setError('Todos los rubros deben tener un tipo.');
    if (lineItems.some((li) => !li.amount || parseFloat(li.amount) <= 0))
      return setError('Todos los rubros deben tener un importe mayor a 0.');

    const aptId = parseInt(apartmentUnit.trim());
    if (isNaN(aptId)) return setError('Ingrese el ID numérico del departamento.');

    setSaving(true);
    try {
      const [year, month] = period.split('-').map(Number);
      const periodDate = new Date(year, month - 1, 1).toISOString();

      const items: CreateExpenseLineItemInput[] = lineItems.map((li) => ({
        typeId: li.typeId,
        subtypeId: li.subtypeId ?? null,
        description: li.description || null,
        amount: parseFloat(li.amount),
      }));

      await createExpense(token, {
        apartmentId: aptId,
        period: periodDate,
        dueDate: new Date(dueDate).toISOString(),
        adminNotes: adminNotes || null,
        lineItems: items,
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la expensa');
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
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nueva Expensa</h3>
              <p className="text-sm text-gray-500">Completá los datos del período y los rubros</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Apartment + Period + Due date */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Departamento <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                placeholder="Ej: 3"
                value={apartmentUnit}
                onChange={(e) => setApartmentUnit(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Número de ID del departamento</p>
            </div>
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

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Rubros <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar gasto
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((li, i) => {
                const selectedType = expenseTypes.find((t) => t.id === li.typeId);
                const subtypes = selectedType?.subtypes ?? [];

                return (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Type select */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                        <select
                          value={li.typeId}
                          onChange={(e) => updateLineItem(i, 'typeId', parseInt(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        >
                          <option value={0} disabled>Seleccionar tipo…</option>
                          {expenseTypes.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subtype select (only when subtypes exist) */}
                      {subtypes.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Subrubro</label>
                          <select
                            value={li.subtypeId ?? ''}
                            onChange={(e) =>
                              updateLineItem(i, 'subtypeId', e.target.value ? parseInt(e.target.value) : null)
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Sin subrubro</option>
                            {subtypes.map((s) => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
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
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            step="0.01"
                            placeholder="0.00"
                            value={li.amount}
                            onChange={(e) => updateLineItem(i, 'amount', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                          />
                          {lineItems.length > 1 && (
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

          {/* Error message */}
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
                  Creando…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Crear expensa
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
