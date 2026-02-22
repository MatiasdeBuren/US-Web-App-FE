import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, AlertCircle, Clock,
  CreditCard, ChevronDown, ChevronRight, X, ArrowLeft,
  Building, Calendar, Search, TrendingDown, Banknote, Layers, Tag, Filter,
} from 'lucide-react';
import {
  getUserExpenses,
  getUserExpensesSummary,
  getUserExpenseDetail,
  getUserExpenseTypes,
  type UserExpense,
  type UserExpensesSummary,
  type UserExpenseTypeWithSubtypes,
  type LineItemsByType,
} from '../api_calls/user_expenses';
import {
  formatCurrency,
  formatPeriod,
  formatDate,
  STATUS_COLORS,
  STATUS_ICONS,
  TYPE_ICONS,
} from '../utils/expensesHelpers';
import { isTokenExpired, handleUnauthorized } from '../utils/auth';
import ExpensePeriodFilterModal, { type PeriodFilterOption } from '../components/ExpensePeriodFilterModal';
import ExpenseStatusFilterModal from '../components/ExpenseStatusFilterModal';
import ExpenseTypeFilterModal from '../components/ExpenseTypeFilterModal';
import ExpenseSubtypeFilterModal from '../components/ExpenseSubtypeFilterModal';

interface SummaryCardsProps {
  summary: UserExpensesSummary;
}

function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      {/* Total debt */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3"
      >
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">Deuda acumulada</p>
          <p className="text-base font-bold text-red-600 mt-0.5 break-words">{formatCurrency(summary.totalDebt)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.pendingCount} exp. pendiente{summary.pendingCount !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {/* Overdue debt */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3"
      >
        <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-orange-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide leading-tight">Deuda vencida</p>
          <p className="text-base font-bold text-orange-600 mt-0.5 break-words">{formatCurrency(summary.overdueDebt)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.overdueCount} exp. vencida{summary.overdueCount !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {/* Last payment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 col-span-2"
      >
        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Banknote className="w-4 h-4 text-green-500" />
        </div>
        {summary.lastPayment ? (
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Último pago</p>
            <p className="text-base font-bold text-green-600 mt-0.5">{formatCurrency(summary.lastPayment.amount)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(summary.lastPayment.paidAt)}
              {summary.lastPayment.paymentMethod && ` · ${summary.lastPayment.paymentMethod.label}`}
              {summary.lastPayment.expense.apartment && ` · Unidad ${summary.lastPayment.expense.apartment.unit}`}
              {' · '}{formatPeriod(summary.lastPayment.expense.period)}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Último pago</p>
            <p className="text-sm text-gray-400 mt-1">Sin pagos registrados</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}


interface ExpenseRowProps {
  expense: UserExpense;
  onClick: () => void;
}

function ExpenseRow({ expense, onClick }: ExpenseRowProps) {
  const statusKey = expense.status?.name ?? '';
  const StatusIcon = STATUS_ICONS[statusKey] ?? Clock;
  const statusClass = STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  const remaining = expense.totalAmount - expense.paidAmount;
  const paid = expense.paidAmount;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-6 group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: period + unit */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 capitalize">{formatPeriod(expense.period)}</p>
            {expense.apartment && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Building className="w-3 h-3" /> Unidad {expense.apartment.unit} · Piso {expense.apartment.floor}
              </p>
            )}
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> Vence {formatDate(expense.dueDate)}
            </p>
          </div>
        </div>

        {/* Right: amount + status */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <p className="text-base font-bold text-gray-900">{formatCurrency(expense.totalAmount)}</p>
          {paid > 0 && remaining > 0 && (
            <p className="text-xs text-gray-400">pagado {formatCurrency(paid)}</p>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusClass}`}>
            <StatusIcon className="w-3 h-3" />
            {expense.status?.label ?? statusKey}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {expense.totalAmount > 0 && (
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${statusKey === 'pagado' ? 'bg-green-400' : statusKey === 'vencido' ? 'bg-red-400' : 'bg-indigo-400'}`}
            style={{ width: `${Math.min(100, (paid / expense.totalAmount) * 100)}%` }}
          />
        </div>
      )}

      {/* Line item type chips */}
      {expense.lineItems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...new Set(expense.lineItems.map((li) => li.type?.label ?? li.type?.name))].map((t) => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <span className="text-xs text-indigo-500 group-hover:text-indigo-700 flex items-center gap-0.5 transition-colors">
          Ver detalle <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.button>
  );
}


interface ExpenseDetailProps {
  expenseId: number;
  token: string;
  onBack: () => void;
}

function ExpenseDetail({ expenseId, token, onBack }: ExpenseDetailProps) {
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<UserExpense | null>(null);
  const [lineItemsByType, setLineItemsByType] = useState<LineItemsByType>({});
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getUserExpenseDetail(token, expenseId)
      .then(({ expense, lineItemsByType }) => {
        setExpense(expense);
        setLineItemsByType(lineItemsByType);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar la expensa'))
      .finally(() => setLoading(false));
  }, [token, expenseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-400">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm">Cargando detalle…</p>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error || 'No se encontró la expensa.'}</p>
      </div>
    );
  }

  const statusKey = expense.status?.name ?? '';
  const StatusIcon = STATUS_ICONS[statusKey] ?? Clock;
  const statusClass = STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  const remaining = expense.totalAmount - expense.paidAmount;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="space-y-5"
    >
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h3 className="text-base font-bold text-gray-900 capitalize">{formatPeriod(expense.period)}</h3>
          {expense.apartment && (
            <p className="text-xs text-gray-500">Unidad {expense.apartment.unit} · Piso {expense.apartment.floor}</p>
          )}
        </div>
      </div>

      {/* Status + amounts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full border ${statusClass}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {expense.status?.label ?? statusKey}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Vence {formatDate(expense.dueDate)}
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
          <div className="pr-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(expense.totalAmount)}</p>
          </div>
          <div className="px-4">
            <p className="text-xs text-gray-500 mb-1">Pagado</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(expense.paidAmount)}</p>
          </div>
          <div className="pl-4">
            <p className="text-xs text-gray-500 mb-1">Saldo</p>
            <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        {expense.totalAmount > 0 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full ${statusKey === 'pagado' ? 'bg-green-400' : statusKey === 'vencido' ? 'bg-red-400' : 'bg-indigo-400'}`}
              style={{ width: `${Math.min(100, (expense.paidAmount / expense.totalAmount) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Line items by type */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Detalle de la liquidación</h4>
        {Object.entries(lineItemsByType).map(([typeName, group]) => {
          const TypeIcon = TYPE_ICONS[typeName] ?? Receipt;
          const isGastosComunes = typeName === 'gastos_comunes';
          return (
            <div key={typeName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Type header */}
              <div className={`flex items-center justify-between px-4 py-3 ${isGastosComunes ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isGastosComunes ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <TypeIcon className={`w-4 h-4 ${isGastosComunes ? 'text-indigo-600' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{group.type.label}</span>
                  {isGastosComunes && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Gastos Comunes</span>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(group.subtotal)}</span>
              </div>

              {/* Line items */}
              <ul className="divide-y divide-gray-50">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      {item.subtype && (
                        <p className="text-sm font-medium text-gray-700">{item.subtype.label}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                      {!item.subtype && !item.description && (
                        <p className="text-sm text-gray-500 italic">Sin descripción</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatCurrency(item.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Payments history */}
      {expense.payments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Pagos registrados</h4>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {expense.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{formatDate(p.paidAt)}</p>
                    <p className="text-xs text-gray-400">{p.paymentMethod?.label ?? 'Sin método'}{p.notes ? ` · ${p.notes}` : ''}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes */}
      {expense.adminNotes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span className="font-medium">Nota administrativa: </span>{expense.adminNotes}
        </div>
      )}
    </motion.div>
  );
}

function UserExpensesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<UserExpensesSummary | null>(null);
  const [expenses, setExpenses] = useState<UserExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const [periodOption, setPeriodOption] = useState<PeriodFilterOption | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [subtypeFilter, setSubtypeFilter] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSubtypeModal, setShowSubtypeModal] = useState(false);
  const [allExpenseTypes, setAllExpenseTypes] = useState<UserExpenseTypeWithSubtypes[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load token — redirect immediately if missing or expired
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t || isTokenExpired(t)) {
      handleUnauthorized();
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    getUserExpensesSummary(token).then(setSummary).catch(() => setSummary(null));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getUserExpenseTypes(token).then(setAllExpenseTypes).catch(() => setAllExpenseTypes([]));
  }, [token]);

  const loadExpenses = useCallback(
    async (page: number = 1, append = false) => {
      if (!token) return;
      if (append) { setLoadingMore(true); } else { setLoading(true); }
      try {
        const isRange = periodOption?.mode === 'range';
        const res = await getUserExpenses(token, {
          page: isRange ? 1 : page,
          limit: isRange ? 500 : 10,
          statusId: statusFilter ? parseInt(statusFilter) : undefined,
          period: periodOption?.mode === 'single' ? periodOption.period : undefined,
        });
        setExpenses((prev) => (append && !isRange ? [...prev, ...res.expenses] : res.expenses));
        setTotalPages(isRange ? 1 : res.pagination.totalPages);
        setTotalCount(res.pagination.total);
        setCurrentPage(isRange ? 1 : page);
      } catch {
        // silently keep previous results
      } finally {
        if (append) { setLoadingMore(false); } else { setLoading(false); }
      }
    },
    [token, statusFilter, periodOption]
  );

  useEffect(() => {
    setCurrentPage(1);
    loadExpenses(1, false);
  }, [loadExpenses]);

  useEffect(() => { setSubtypeFilter(''); }, [typeFilter]);

  const displayedExpenses = expenses.filter((exp) => {
    if (periodOption?.mode === 'range' && periodOption.periodFrom && periodOption.periodTo) {
      if (exp.period < periodOption.periodFrom || exp.period > periodOption.periodTo) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (
        !exp.apartment?.unit.toLowerCase().includes(q) &&
        !formatPeriod(exp.period).toLowerCase().includes(q) &&
        !exp.lineItems.some((li) => li.type?.label?.toLowerCase().includes(q))
      ) return false;
    }
    if (typeFilter) {
      const tid = parseInt(typeFilter);
      if (!exp.lineItems.some((li) => li.typeId === tid)) return false;
    }
    if (subtypeFilter) {
      const sid = parseInt(subtypeFilter);
      if (!exp.lineItems.some((li) => li.subtypeId === sid)) return false;
    }
    return true;
  });

  const periodLabel = periodOption && periodOption.value !== 'all' ? periodOption.label : null;
  const statusLabel = statusFilter
    ? (['', 'Pendiente', 'Parcial', 'Pagado', 'Vencido'][parseInt(statusFilter)] ?? null)
    : null;
  const selectedTypeObj = allExpenseTypes.find((t) => String(t.id) === typeFilter);
  const availableSubtypes = selectedTypeObj?.subtypes ?? [];
  const hasSubtypes = availableSubtypes.length > 0;
  const selectedSubtypeObj = availableSubtypes.find((s) => String(s.id) === subtypeFilter);

  if (!token) return null;

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mis Expensas</h1>
          <p className="text-gray-600">{totalCount} expensa{totalCount !== 1 ? 's' : ''} registrada{totalCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Summary cards — only in list view */}
        {summary && selectedExpenseId === null && <SummaryCards summary={summary} />}

        {/* Search and Filters — only in list view */}
        {selectedExpenseId === null && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por unidad, período, tipo…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex gap-3 flex-wrap items-center">
                {/* Period modal trigger */}
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(true)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[160px] ${
                    periodLabel
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{periodLabel ?? 'Período'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Status modal trigger */}
                <button
                  type="button"
                  onClick={() => setShowStatusModal(true)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[160px] ${
                    statusLabel
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{statusLabel ?? 'Estado'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Type modal trigger */}
                <button
                  type="button"
                  onClick={() => setShowTypeModal(true)}
                  className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[150px] ${
                    typeFilter
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{selectedTypeObj?.label ?? 'Tipo'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                {/* Subtype modal trigger */}
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
                        <ChevronRight className="w-3.5 h-3.5 text-pink-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSubtypeModal(true)}
                        className={`flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer min-w-[150px] ${
                          subtypeFilter
                            ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-sm'
                            : 'bg-white border-purple-200 text-gray-600 hover:border-violet-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className={`w-4 h-4 flex-shrink-0 ${subtypeFilter ? 'text-white' : 'text-purple-400'}`} />
                          <span className="truncate">{selectedSubtypeObj?.label ?? 'Subtipo'}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 flex-shrink-0 ${subtypeFilter ? 'text-white/70' : 'text-gray-400'}`} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Clear filters */}
                {(periodOption?.value !== 'all' && periodOption !== null || statusFilter || searchTerm || typeFilter || subtypeFilter) && (
                  <button
                    type="button"
                    onClick={() => { setPeriodOption(null); setStatusFilter(''); setSearchTerm(''); setTypeFilter(''); setSubtypeFilter(''); }}
                    className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter modals */}
      <ExpensePeriodFilterModal
        isVisible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        selectedValue={periodOption?.value ?? 'all'}
        onPeriodSelect={(opt) => setPeriodOption(opt)}
      />
      <ExpenseStatusFilterModal
        isVisible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        selectedStatus={statusFilter}
        onStatusSelect={(val) => setStatusFilter(val)}
      />
      <ExpenseTypeFilterModal
        isVisible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        selectedTypeId={typeFilter}
        onTypeSelect={(val) => { setTypeFilter(val); setSubtypeFilter(''); }}
        expenseTypes={allExpenseTypes}
      />
      <ExpenseSubtypeFilterModal
        isVisible={showSubtypeModal}
        onClose={() => setShowSubtypeModal(false)}
        selectedSubtypeId={subtypeFilter}
        onSubtypeSelect={(val) => setSubtypeFilter(val)}
        subtypes={availableSubtypes}
        parentTypeLabel={selectedTypeObj?.label}
      />

      {/* Detail or List view */}
      <AnimatePresence mode="wait">
        {selectedExpenseId !== null ? (
          <ExpenseDetail
            key={selectedExpenseId}
            expenseId={selectedExpenseId}
            token={token}
            onBack={() => setSelectedExpenseId(null)}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Cargando expensas…</p>
              </div>
            ) : displayedExpenses.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay expensas</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter || typeFilter || subtypeFilter || (periodOption && periodOption.value !== 'all')
                    ? 'No se encontraron expensas con los filtros aplicados.'
                    : 'Aún no tienes expensas registradas.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedExpenses.map((exp) => (
                  <ExpenseRow
                    key={exp.id}
                    expense={exp}
                    onClick={() => setSelectedExpenseId(exp.id)}
                  />
                ))}

                {/* Load more */}
                {currentPage < totalPages && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => loadExpenses(currentPage + 1, true)}
                      className="px-6 py-3 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 rounded-xl bg-white hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? 'Cargando…' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserExpensesPage;
