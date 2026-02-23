import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, Users, UserCircle2, Building2, User, Layers, Tag } from 'lucide-react';
import { createExpense, type ExpenseType, type CreateExpenseLineItemInput } from '../api_calls/expenses';
import { getAdminApartments, getAdminUsers, type AdminApartment, type AdminUser } from '../api_calls/admin';
import { formatCurrency } from '../utils/expensesHelpers';
import ApartmentPickerModal from './ApartmentPickerModal';
import UserPickerModal from './UserPickerModal';
import LineItemTypePickerModal from './LineItemTypePickerModal';
import LineItemSubtypePickerModal from './LineItemSubtypePickerModal';

export interface LineItemForm {
  typeId: number;
  subtypeId: number | null;
  description: string;
  amount: string;
}

export interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (unitLabel?: string) => void;
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
  const [submitted, setSubmitted] = useState(false);

  const [apartments, setApartments] = useState<AdminApartment[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);

  const [showResidents, setShowResidents] = useState(false);
  const [residents, setResidents] = useState<AdminUser[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

  // por usuario
  const [assignMode, setAssignMode] = useState<'unit' | 'user'>('unit');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // picker modals
  const [showApartmentPicker, setShowApartmentPicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [typePickerIndex, setTypePickerIndex] = useState<number | null>(null);
  const [subtypePickerIndex, setSubtypePickerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApartmentUnit('');
      const now = new Date();
      setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setDueDate('');
      setAdminNotes('');
      setLineItems([{ typeId: 0, subtypeId: null, description: '', amount: '' }]);
      setError('');
      setSubmitted(false);
      setShowResidents(false);
      setResidents([]);
      setAssignMode('unit');
      setSelectedUserId('');
      setUsers([]);
      setLoadingApartments(true);
      getAdminApartments(token)
        .then((data) => setApartments(data))
        .catch(() => setApartments([]))
        .finally(() => setLoadingApartments(false));
    }
  }, [isOpen, token]);

  const handleSwitchMode = async (mode: 'unit' | 'user') => {
    if (mode === assignMode) return;
    setAssignMode(mode);
    setShowResidents(false);
    if (mode === 'user' && users.length === 0) {
      setLoadingUsers(true);
      try {
        const allUsers = await getAdminUsers(token);
        setUsers(allUsers.filter((u) => u.apartmentId && u.role === 'tenant'));
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleViewResidents = async () => {
    if (!apartmentUnit) return;
    if (showResidents) { setShowResidents(false); return; }
    setLoadingResidents(true);
    setShowResidents(true);
    try {
      const allUsers = await getAdminUsers(token);
      const aptId = parseInt(apartmentUnit);
      setResidents(allUsers.filter((u) => u.apartmentId === aptId && u.role === 'tenant'));
    } catch {
      setResidents([]);
    } finally {
      setLoadingResidents(false);
    }
  };

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
    setSubmitted(true);
    setError('');

    if (!period) return setError('Seleccione el período.');
    if (!dueDate) return setError('Ingrese la fecha de vencimiento.');
    if (lineItems.some((li) => !li.typeId)) return setError('Todos los rubros deben tener un tipo seleccionado.');
    if (lineItems.some((li) => {
      const t = expenseTypes.find((t) => t.id === li.typeId);
      return t && (t.subtypes?.length ?? 0) > 0 && li.subtypeId === null;
    })) return setError('Los rubros con subrubros deben tener uno seleccionado.');
    if (lineItems.some((li) => !li.amount || parseFloat(li.amount) <= 0))
      return setError('Todos los rubros deben tener un importe mayor a 0.');

    let aptId: number;
    let unitLabel: string | undefined;

    if (assignMode === 'unit') {
      if (!apartmentUnit.trim()) return setError('Seleccione un departamento.');
      aptId = parseInt(apartmentUnit.trim());
      if (isNaN(aptId)) return setError('Departamento inválido.');
      unitLabel = apartments.find((a) => a.id === aptId)?.unit;
    } else {
      if (!selectedUserId) return setError('Seleccione un usuario.');
      const selUser = users.find((u) => String(u.id) === selectedUserId);
      if (!selUser?.apartmentId) return setError('El usuario seleccionado no tiene departamento asignado.');
      aptId = selUser.apartmentId;
      unitLabel = selUser.apartment?.unit;
    }

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

      onCreated(unitLabel);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la expensa');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedApartment = apartments.find((a) => String(a.id) === apartmentUnit) ?? null;
  const selectedUser = users.find((u) => String(u.id) === selectedUserId) ?? null;

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

          {/* Mode toggle — Por Unidad / Por Usuario */}
          <div className="flex bg-gray-100 rounded-xl p-1 text-sm gap-1">
            <button
              type="button"
              onClick={() => handleSwitchMode('unit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                assignMode === 'unit'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Por Unidad
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                assignMode === 'user'
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Por Usuario
            </button>
          </div>

          {/* Apartment + Period + Due date */}
          <div className="grid md:grid-cols-3 gap-4">

            {/* ── POR UNIDAD ── */}
            {assignMode === 'unit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento <span className="text-red-500">*</span>
              </label>

              {/* Picker trigger */}
              <button
                type="button"
                onClick={() => setShowApartmentPicker(true)}
                disabled={loadingApartments}
                className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  apartmentUnit
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className={`w-4 h-4 flex-shrink-0 ${apartmentUnit ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <span className="truncate">
                    {loadingApartments
                      ? 'Cargando…'
                      : apartmentUnit
                      ? (selectedApartment ? `Unidad ${selectedApartment.unit} — Piso ${selectedApartment.floor}` : 'Seleccionar…')
                        : 'Seleccionar departamento…'}
                  </span>
                </div>
              </button>

              {/* Detail + residents toggle below selected */}
              {selectedApartment && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      {selectedApartment.rooms ? `${selectedApartment.rooms} amb` : ''}{selectedApartment.areaM2 ? ` · ${selectedApartment.areaM2} m²` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={handleViewResidents}
                      className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      <Users className="w-3 h-3" />
                      {showResidents ? 'Ocultar habitantes' : 'Ver habitantes'}
                    </button>
                    <AnimatePresence>
                      {showResidents && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 mt-1">
                            {loadingResidents ? (
                              <div className="flex items-center justify-center py-3">
                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                              </div>
                            ) : residents.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-1">Sin habitantes registrados</p>
                            ) : (
                              <ul className="space-y-2">
                                {residents.map((u) => (
                                  <li key={u.id} className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                      <UserCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-gray-800 truncate">{u.name}</p>
                                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              )}

            </div>
            )}

            {/* ── POR USUARIO ── */}
            {assignMode === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario <span className="text-red-500">*</span>
              </label>

              {/* Picker trigger */}
              <button
                type="button"
                onClick={() => setShowUserPicker(true)}
                disabled={loadingUsers}
                className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  selectedUserId
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserCircle2 className={`w-4 h-4 flex-shrink-0 ${selectedUserId ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <span className="truncate">
                    {loadingUsers
                      ? 'Cargando…'
                      : selectedUserId
                      ? (selectedUser?.name ?? 'Seleccionar…')
                        : 'Seleccionar usuario…'}
                  </span>
                </div>
              </button>

              {/* Apartment hint below selected user */}
              {selectedUserId && (
                selectedUser?.apartment ? (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Unidad {selectedUser.apartment.unit} · Piso {selectedUser.apartment.floor}
                  </p>
                ) : (
                  <p className="text-xs text-red-400 mt-1.5">Sin departamento asignado</p>
                )
              )}

            </div>
            )}

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

                      {/* Subtype picker (only when subtypes exist) */}
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
        subtypes={subtypePickerIndex !== null ? (expenseTypes.find((t) => t.id === lineItems[subtypePickerIndex].typeId)?.subtypes ?? []) : []}
        typeName={subtypePickerIndex !== null ? (expenseTypes.find((t) => t.id === lineItems[subtypePickerIndex].typeId)?.label ?? '') : ''}
        usedSubtypeIds={
          subtypePickerIndex !== null
            ? lineItems
                .filter((_, j) => j !== subtypePickerIndex && lineItems[j].typeId === lineItems[subtypePickerIndex].typeId && lineItems[j].subtypeId !== null)
                .map((li) => li.subtypeId as number)
            : []
        }
      />
      <ApartmentPickerModal
        isVisible={showApartmentPicker}
        onClose={() => setShowApartmentPicker(false)}
        onSelect={(apt) => { setApartmentUnit(String(apt.id)); setShowResidents(false); setResidents([]); }}
        selectedId={apartmentUnit}
        apartments={apartments}
        loading={loadingApartments}
      />
      <UserPickerModal
        isVisible={showUserPicker}
        onClose={() => setShowUserPicker(false)}
        onSelect={(u) => setSelectedUserId(String(u.id))}
        selectedId={selectedUserId}
        users={users}
        loading={loadingUsers}
      />
    </div>
  );
}
