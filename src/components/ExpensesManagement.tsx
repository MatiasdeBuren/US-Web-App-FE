import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, ChevronDown, ChevronRight, Plus, FileText, Receipt, Clock, Building2, Tag, Layers } from 'lucide-react';
import { useExpensesManagement } from '../hooks/useExpensesManagement';
import { STATUS_ICONS, TYPE_ICONS } from '../utils/expensesHelpers';
import ExpenseCard from './ExpenseCard';
import CreateExpenseModal from './CreateExpenseModal';
import RegisterPaymentModal from './RegisterPaymentModal';
import ConfirmDeleteExpenseModal from './ConfirmDeleteExpenseModal';
import ExpenseSuccessToast from './ExpenseSuccessToast';

interface ExpensesManagementProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}


export default function ExpensesManagement({ isOpen, onClose, token }: ExpensesManagementProps) {
  const {
    expenses,
    expenseTypes,
    expenseStatuses,
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

  const hasActiveFilters = !!(selectedStatusId || selectedTypeId || selectedSubtypeId || selectedApartmentId || searchTerm);

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
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-3 items-center">

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por depto. o inquilino…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Status filter */}
                <div className="relative">
                  <button
                    onClick={() => { setShowStatusFilter(!showStatusFilter); setShowTypeFilter(false); setShowApartmentFilter(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-300 transition-colors cursor-pointer min-w-[170px]"
                  >
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className={selectedStatusId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                      {getCurrentStatusLabel()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>

                  <AnimatePresence>
                    {showStatusFilter && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[170px]"
                      >
                        <button
                          onClick={() => { setSelectedStatusId(null); setShowStatusFilter(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${!selectedStatusId ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                        >
                          Todos los estados
                        </button>
                        {expenseStatuses.map((s) => {
                          const Icon = STATUS_ICONS[s.name] ?? Clock;
                          return (
                            <button
                              key={s.id}
                              onClick={() => { setSelectedStatusId(s.id); setShowStatusFilter(false); }}
                              className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedStatusId === s.id ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                            >
                              <Icon className="w-4 h-4" />
                              {s.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Type + Subtype cascading filter ── */}
                <div className="flex items-center gap-1">

                  {/* Type pill */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowTypeFilter(!showTypeFilter); setShowStatusFilter(false); setShowApartmentFilter(false); setShowSubtypeFilter(false); }}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer min-w-[160px] ${
                        selectedTypeId
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200/60 border border-transparent'
                          : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:shadow-sm hover:text-gray-700'
                      }`}
                    >
                      {selectedTypeId
                        ? (() => { const Icon = TYPE_ICONS[(selectedType?.name ?? '')] ?? FileText; return <Icon className="w-4 h-4 flex-shrink-0" />; })()
                        : <Layers className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                      }
                      <span className="truncate">{getCurrentTypeLabel()}</span>
                      <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform duration-200 ${showTypeFilter ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showTypeFilter && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 bg-white border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/60 z-20 py-2 min-w-[180px] overflow-hidden"
                        >
                          <div className="px-3 pb-1.5 pt-0.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo de expensa</p>
                          </div>
                          <button
                            onClick={() => { setSelectedTypeId(null); setShowTypeFilter(false); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                              !selectedTypeId ? 'font-semibold text-indigo-600 bg-indigo-50/60' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                              <FileText className="w-3 h-3 text-gray-400" />
                            </span>
                            Todos los tipos
                          </button>
                          {expenseTypes.map((t) => {
                            const Icon = TYPE_ICONS[t.name] ?? FileText;
                            const isActive = selectedTypeId === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => { setSelectedTypeId(t.id); setShowTypeFilter(false); }}
                                className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                                  isActive ? 'font-semibold text-indigo-600 bg-indigo-50/60' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                  isActive ? 'bg-indigo-100' : 'bg-gray-100'
                                }`}>
                                  <Icon className={`w-3 h-3 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                                </span>
                                {t.label}
                                {(subtypesByTypeId.get(t.id)?.length ?? 0) > 0 && (
                                  <span className="ml-auto text-[10px] bg-purple-50 text-purple-500 border border-purple-100 rounded-full px-1.5 py-0.5 font-semibold">
                                    {subtypesByTypeId.get(t.id)!.length}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Connector + Subtype pill */}
                  <AnimatePresence>
                    {hasSubtypes && (
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="flex items-center gap-1"
                      >
                        {/* Spark connector */}
                        <div className="flex items-center gap-0 flex-shrink-0">
                          <div className="w-3 h-px bg-gradient-to-r from-purple-400 to-pink-400" />
                          <ChevronRight className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                        </div>

                        {/* Subtype pill */}
                        <div className="relative">
                          <button
                            onClick={() => { setShowSubtypeFilter(!showSubtypeFilter); setShowTypeFilter(false); setShowStatusFilter(false); setShowApartmentFilter(false); }}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer min-w-[168px] ${
                              selectedSubtypeId
                                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-200/60 border border-transparent'
                                : 'bg-white border border-purple-200 text-gray-500 hover:border-violet-400 hover:shadow-sm hover:text-gray-700'
                            }`}
                          >
                            <Tag className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              selectedSubtypeId ? 'text-white' : 'text-purple-400 group-hover:text-violet-500'
                            }`} />
                            <span className="truncate">{availableSubtypes.find((s) => s.id === selectedSubtypeId)?.label ?? 'Subtipo'}</span>
                            <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform duration-200 ${showSubtypeFilter ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showSubtypeFilter && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 mt-2 bg-white border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/60 z-20 py-2 min-w-[180px] overflow-hidden"
                              >
                                <div className="px-3 pb-1.5 pt-0.5">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Subtipo</p>
                                  <p className="text-[11px] text-gray-400 truncate">{selectedType?.label}</p>
                                </div>
                                <button
                                  onClick={() => { setSelectedSubtypeId(null); setShowSubtypeFilter(false); }}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                                    !selectedSubtypeId ? 'font-semibold text-violet-600 bg-violet-50/60' : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                                    <Tag className="w-3 h-3 text-gray-400" />
                                  </span>
                                  Todos los subtipos
                                </button>
                                {availableSubtypes.map((s) => {
                                  const isActive = selectedSubtypeId === s.id;
                                  return (
                                    <button
                                      key={s.id}
                                      onClick={() => { setSelectedSubtypeId(s.id); setShowSubtypeFilter(false); }}
                                      className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                                        isActive ? 'font-semibold text-violet-600 bg-violet-50/60' : 'text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                        isActive ? 'bg-violet-100' : 'bg-gray-100'
                                      }`}>
                                        <Tag className={`w-3 h-3 ${isActive ? 'text-violet-500' : 'text-gray-400'}`} />
                                      </span>
                                      {s.label}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Apartment filter */}
                <div className="relative">
                  <button
                    onClick={() => { setShowApartmentFilter(!showApartmentFilter); setShowStatusFilter(false); setShowTypeFilter(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-300 transition-colors cursor-pointer min-w-[170px]"
                  >
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className={selectedApartmentId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                      {getCurrentApartmentLabel()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>

                  <AnimatePresence>
                    {showApartmentFilter && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[180px] max-h-64 overflow-y-auto"
                      >
                        <button
                          onClick={() => { setSelectedApartmentId(null); setShowApartmentFilter(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                            !selectedApartmentId ? 'font-semibold text-indigo-600' : 'text-gray-700'
                          }`}
                        >
                          Todos los deptos.
                        </button>
                        {apartments.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => { setSelectedApartmentId(apt.id); setShowApartmentFilter(false); }}
                            className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                              selectedApartmentId === apt.id ? 'font-semibold text-indigo-600' : 'text-gray-700'
                            }`}
                          >
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span>Depto. {apt.unit}</span>
                            <span className="ml-auto text-xs text-gray-400">Piso {apt.floor}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* ── Expense list ── */}
            <div
              className="flex-1 overflow-y-auto px-6 py-5 min-h-0"
              onClick={() => { setShowStatusFilter(false); setShowTypeFilter(false); setShowSubtypeFilter(false); }}
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
