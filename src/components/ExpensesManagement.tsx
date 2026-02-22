import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, ChevronDown, ChevronRight, Plus, Receipt, Building2, Tag, Layers, Calendar } from 'lucide-react';
import { useExpensesManagement } from '../hooks/useExpensesManagement';
import ExpenseCard from './ExpenseCard';
import CreateExpenseModal from './CreateExpenseModal';
import RegisterPaymentModal from './RegisterPaymentModal';
import ConfirmDeleteExpenseModal from './ConfirmDeleteExpenseModal';
import ExpenseSuccessToast from './ExpenseSuccessToast';
import ExpensePeriodFilterModal from './ExpensePeriodFilterModal';
import ExpenseStatusFilterModal from './ExpenseStatusFilterModal';
import ExpenseTypeFilterModal from './ExpenseTypeFilterModal';
import ExpenseSubtypeFilterModal from './ExpenseSubtypeFilterModal';
import ExpenseApartmentFilterModal from './ExpenseApartmentFilterModal';
import type { UserExpenseTypeWithSubtypes, UserExpenseSubtype } from '../api_calls/user_expenses';

interface ExpensesManagementProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}


export default function ExpensesManagement({ isOpen, onClose, token }: ExpensesManagementProps) {
  const {
    expenses,
    expenseTypes,
    paymentMethods,
    apartments,
    loading,
    isDeleting,
    searchTerm,
    setSearchTerm,
    selectedStatusId,
    setSelectedStatusId,
    selectedTypeId,
    setSelectedTypeId,
    selectedSubtypeId,
    setSelectedSubtypeId,
    selectedApartmentId,
    setSelectedApartmentId,
    showStatusFilter,
    setShowStatusFilter,
    showTypeFilter,
    setShowTypeFilter,
    showSubtypeFilter,
    setShowSubtypeFilter,
    showApartmentFilter,
    setShowApartmentFilter,
    selectedPeriodOption,
    setSelectedPeriodOption,
    showPeriodModal,
    setShowPeriodModal,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    showCreate,
    setShowCreate,
    expenseToPayment,
    setExpenseToPayment,
    expenseToDelete,
    setExpenseToDelete,
    displayedExpenses,
    getCurrentStatusLabel,
    getCurrentTypeLabel,
    getCurrentApartmentLabel,
    loadExpenses,
    handlePaymentRegistered,
    handleDeleteConfirm,
    clearFilters,
  } = useExpensesManagement({ isOpen, token });

  const hasActiveFilters = !!(selectedStatusId || selectedTypeId || selectedSubtypeId || selectedApartmentId || searchTerm || (selectedPeriodOption && selectedPeriodOption.value !== 'all'));

  const subtypesByTypeId = useMemo(() => {
    const map = new Map<number, { id: number; name: string; label: string; typeId: number }[]>();
    expenses.forEach((exp) => {
      exp.lineItems.forEach((li) => {
        if (li.subtypeId && li.subtype) {
          if (!map.has(li.typeId)) map.set(li.typeId, []);
          const list = map.get(li.typeId)!;
          if (!list.find((s) => s.id === li.subtypeId)) {
            list.push(li.subtype as { id: number; name: string; label: string; typeId: number });
          }
        }
      });
    });
    return map;
  }, [expenses]);

  const selectedType = expenseTypes.find((t) => t.id === selectedTypeId);
  const availableSubtypes = selectedTypeId ? (subtypesByTypeId.get(selectedTypeId) ?? []) : [];
  const hasSubtypes = availableSubtypes.length > 0;

  const [showExpenseToast, setShowExpenseToast] = useState(false);
  const [toastUnitLabel, setToastUnitLabel] = useState<string | undefined>(undefined);

  const handleExpenseCreated = (unitLabel?: string) => {
    setToastUnitLabel(unitLabel);
    setShowExpenseToast(true);
    loadExpenses();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-[1400px] max-w-[95vw] h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Expensas</h2>
                  <p className="text-sm text-gray-500">{totalCount} expensas en total</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva expensa
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* ── Filter bar ── */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex flex-wrap gap-3 items-center">

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por depto. o inquilino…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Period */}
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(true)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[160px] ${
                    selectedPeriodOption && selectedPeriodOption.value !== 'all'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{selectedPeriodOption && selectedPeriodOption.value !== 'all' ? selectedPeriodOption.label : 'Período'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Status */}
                <button
                  type="button"
                  onClick={() => setShowStatusFilter(true)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[170px] ${
                    selectedStatusId
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{getCurrentStatusLabel()}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Type + Subtype */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowTypeFilter(true)}
                    className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[160px] ${
                      selectedTypeId
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{getCurrentTypeLabel()}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>

                  <AnimatePresence>
                    {hasSubtypes && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="flex items-center gap-1"
                      >
                        <div className="flex items-center flex-shrink-0">
                          <div className="w-3 h-px bg-gradient-to-r from-purple-400 to-pink-400" />
                          <ChevronRight className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSubtypeFilter(true)}
                          className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[150px] ${
                            selectedSubtypeId
                              ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-sm'
                              : 'bg-white border-purple-200 text-gray-600 hover:border-violet-400 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Tag className={`w-4 h-4 flex-shrink-0 ${selectedSubtypeId ? 'text-white' : 'text-purple-400'}`} />
                            <span className="truncate">{availableSubtypes.find((s) => s.id === selectedSubtypeId)?.label ?? 'Subtipo'}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 flex-shrink-0 ${selectedSubtypeId ? 'text-white/70' : 'text-gray-400'}`} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Apartment */}
                <button
                  type="button"
                  onClick={() => setShowApartmentFilter(true)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[170px] ${
                    selectedApartmentId
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{getCurrentApartmentLabel()}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* ── Expense list ── */}
            <div
              className="flex-1 overflow-y-auto px-6 py-5 min-h-0"
            >
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
              ) : displayedExpenses.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Sin expensas</h3>
                  <p className="text-sm text-gray-500">
                    No se encontraron expensas con los filtros actuales.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedExpenses.map((exp) => (
                    <ExpenseCard
                      key={exp.id}
                      expense={exp}
                      onRegisterPayment={setExpenseToPayment}
                      onDelete={setExpenseToDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages} — {totalCount} expensas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* ── Filter modals ── */}
      <ExpensePeriodFilterModal
        isVisible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        selectedValue={selectedPeriodOption?.value ?? 'all'}
        onPeriodSelect={(opt) => setSelectedPeriodOption(opt)}
      />
      <ExpenseStatusFilterModal
        isVisible={showStatusFilter}
        onClose={() => setShowStatusFilter(false)}
        selectedStatus={selectedStatusId ? String(selectedStatusId) : ''}
        onStatusSelect={(val) => { setSelectedStatusId(val ? parseInt(val) : null); }}
      />
      <ExpenseTypeFilterModal
        isVisible={showTypeFilter}
        onClose={() => setShowTypeFilter(false)}
        selectedTypeId={selectedTypeId ? String(selectedTypeId) : ''}
        onTypeSelect={(val) => { setSelectedTypeId(val ? parseInt(val) : null); setSelectedSubtypeId(null); }}
        expenseTypes={(expenseTypes as unknown as UserExpenseTypeWithSubtypes[])}
      />
      <ExpenseSubtypeFilterModal
        isVisible={showSubtypeFilter}
        onClose={() => setShowSubtypeFilter(false)}
        selectedSubtypeId={selectedSubtypeId ? String(selectedSubtypeId) : ''}
        onSubtypeSelect={(val) => { setSelectedSubtypeId(val ? parseInt(val) : null); }}
        subtypes={(availableSubtypes as unknown as UserExpenseSubtype[])}
        parentTypeLabel={selectedType?.label}
      />

      <ExpenseApartmentFilterModal
        isVisible={showApartmentFilter}
        onClose={() => setShowApartmentFilter(false)}
        apartments={apartments}
        selectedApartmentId={selectedApartmentId}
        onApartmentSelect={(id) => setSelectedApartmentId(id)}
      />

      {/* ── Sub-modals ── */}
      {showCreate && (
        <CreateExpenseModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={handleExpenseCreated}
          token={token}
          expenseTypes={expenseTypes}
        />
      )}

      <ExpenseSuccessToast
        isVisible={showExpenseToast}
        onComplete={() => setShowExpenseToast(false)}
        action="created"
        unitLabel={toastUnitLabel}
      />
      {expenseToPayment && (
        <RegisterPaymentModal
          isOpen={!!expenseToPayment}
          expense={expenseToPayment}
          onClose={() => setExpenseToPayment(null)}
          onRegistered={handlePaymentRegistered}
          token={token}
          paymentMethods={paymentMethods}
        />
      )}
      {expenseToDelete && (
        <ConfirmDeleteExpenseModal
          isOpen={!!expenseToDelete}
          expense={expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
