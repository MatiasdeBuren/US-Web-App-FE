import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, ChevronDown, Plus, FileText, Receipt, Clock } from 'lucide-react';
import { useExpensesManagement } from '../hooks/useExpensesManagement';
import { STATUS_ICONS, TYPE_ICONS } from '../utils/expensesHelpers';
import ExpenseCard from './ExpenseCard';
import CreateExpenseModal from './CreateExpenseModal';
import RegisterPaymentModal from './RegisterPaymentModal';
import ConfirmDeleteExpenseModal from './ConfirmDeleteExpenseModal';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExpensesManagementProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}



// ─── Component ─────────────────────────────────────────────────────────────────

export default function ExpensesManagement({ isOpen, onClose, token }: ExpensesManagementProps) {
  const {
    expenseTypes,
    expenseStatuses,
    paymentMethods,
    loading,
    isDeleting,
    searchTerm,
    setSearchTerm,
    selectedStatusId,
    setSelectedStatusId,
    selectedTypeId,
    setSelectedTypeId,
    showStatusFilter,
    setShowStatusFilter,
    showTypeFilter,
    setShowTypeFilter,
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
    loadExpenses,
    handlePaymentRegistered,
    handleDeleteConfirm,
    clearFilters,
  } = useExpensesManagement({ isOpen, token });

  const hasActiveFilters = !!(selectedStatusId || selectedTypeId || searchTerm);

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
                    onClick={() => { setShowStatusFilter(!showStatusFilter); setShowTypeFilter(false); }}
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

                {/* Type filter (client-side) */}
                <div className="relative">
                  <button
                    onClick={() => { setShowTypeFilter(!showTypeFilter); setShowStatusFilter(false); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-300 transition-colors cursor-pointer min-w-[170px]"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className={selectedTypeId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                      {getCurrentTypeLabel()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>

                  <AnimatePresence>
                    {showTypeFilter && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[170px]"
                      >
                        <button
                          onClick={() => { setSelectedTypeId(null); setShowTypeFilter(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${!selectedTypeId ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                        >
                          Todos los tipos
                        </button>
                        {expenseTypes.map((t) => {
                          const Icon = TYPE_ICONS[t.name] ?? FileText;
                          return (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedTypeId(t.id); setShowTypeFilter(false); }}
                              className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedTypeId === t.id ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                            >
                              <Icon className="w-4 h-4" />
                              {t.label}
                            </button>
                          );
                        })}
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
              onClick={() => { setShowStatusFilter(false); setShowTypeFilter(false); }}
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
          onCreated={loadExpenses}
          token={token}
          expenseTypes={expenseTypes}
        />
      )}
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
