import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, AlertCircle, CheckCircle, Clock,
  CreditCard, ChevronDown, ChevronRight, X, ArrowLeft,
  Building, Calendar, Search, TrendingDown, Banknote, Layers, Tag, FileText,
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


const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: '1', label: 'Pendiente' },
  { value: '2', label: 'Parcial' },
  { value: '3', label: 'Pagado' },
  { value: '4', label: 'Vencido' },
];

function buildPeriodOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [{ value: '', label: 'Todos los períodos' }];
  const now = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
    options.push({ value, label });
  }
  return options;
}

const PERIOD_OPTIONS = buildPeriodOptions();

interface SummaryCardsProps {
  summary: UserExpensesSummary;
}

function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total debt */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
      >
        <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Deuda acumulada</p>
          <p className="text-xl font-bold text-red-600 mt-0.5 truncate">{formatCurrency(summary.totalDebt)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.pendingCount} exp. pendiente{summary.pendingCount !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {/* Overdue debt */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
      >
        <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-orange-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Deuda vencida</p>
          <p className="text-xl font-bold text-orange-600 mt-0.5 truncate">{formatCurrency(summary.overdueDebt)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.overdueCount} exp. vencida{summary.overdueCount !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {/* Last payment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 sm:col-span-2"
      >
        <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Banknote className="w-5 h-5 text-green-500" />
        </div>
        {summary.lastPayment ? (
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Último pago</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">{formatCurrency(summary.lastPayment.amount)}</p>
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
      className="w-full text-left bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-4 group"
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

  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [subtypeFilter, setSubtypeFilter] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSubtypeDropdown, setShowSubtypeDropdown] = useState(false);
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
        const res = await getUserExpenses(token, {
          page,
          limit: 10,
          statusId: statusFilter ? parseInt(statusFilter) : undefined,
          period: periodFilter || undefined,
        });
        setExpenses((prev) => (append ? [...prev, ...res.expenses] : res.expenses));
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
        setCurrentPage(page);
      } catch {
        // silently keep previous results
      } finally {
        if (append) { setLoadingMore(false); } else { setLoading(false); }
      }
    },
    [token, statusFilter, periodFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
    loadExpenses(1, false);
  }, [loadExpenses]);

  useEffect(() => { setSubtypeFilter(''); }, [typeFilter]);

  const selectedTypeObj = allExpenseTypes.find((t) => String(t.id) === typeFilter);
  const availableSubtypes = selectedTypeObj?.subtypes ?? [];
  const hasSubtypes = availableSubtypes.length > 0;

  const displayedExpenses = expenses.filter((exp) => {
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

  if (!token) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis Expensas</h2>
          <p className="text-sm text-gray-500">{totalCount} expensa{totalCount !== 1 ? 's' : ''} en total</p>
        </div>
      </div>

      {/* Summary */}
      {summary && <SummaryCards summary={summary} />}

      {/* Detail view */}
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
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por unidad, período, tipo…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Period dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowPeriodDropdown((o) => !o); setShowStatusDropdown(false); setShowTypeDropdown(false); setShowSubtypeDropdown(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors cursor-pointer ${periodFilter ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Calendar className="w-4 h-4" />
                  {periodFilter ? PERIOD_OPTIONS.find((o) => o.value === periodFilter)?.label : 'Período'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {showPeriodDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 top-full mt-1 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      <ul className="max-h-56 overflow-y-auto py-1">
                        {PERIOD_OPTIONS.map((opt) => (
                          <li key={opt.value}>
                            <button
                              type="button"
                              className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${periodFilter === opt.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                              onClick={() => { setPeriodFilter(opt.value); setShowPeriodDropdown(false); }}
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowStatusDropdown((o) => !o); setShowPeriodDropdown(false); setShowTypeDropdown(false); setShowSubtypeDropdown(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-colors cursor-pointer ${statusFilter ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {statusFilter ? STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label : 'Estado'}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {showStatusDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 top-full mt-1 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      <ul className="py-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <li key={opt.value}>
                            <button
                              type="button"
                              className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${statusFilter === opt.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                              onClick={() => { setStatusFilter(opt.value); setShowStatusDropdown(false); }}
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Type + Subtype cascade — always visible */}
              <div className="flex items-center gap-1">
                  {/* Type pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowTypeDropdown((o) => !o); setShowPeriodDropdown(false); setShowStatusDropdown(false); setShowSubtypeDropdown(false); }}
                      className={`group flex items-center gap-2 px-3 py-2 text-sm rounded-xl border font-medium transition-all duration-200 cursor-pointer ${
                        typeFilter
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-200/60'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-gray-700 hover:shadow-sm'
                      }`}
                    >
                      {typeFilter
                        ? (() => { const Icon = TYPE_ICONS[selectedTypeObj?.name ?? ''] ?? FileText; return <Icon className="w-4 h-4 flex-shrink-0" />; })()
                        : <Layers className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                      }
                      <span className="truncate">{selectedTypeObj?.label ?? 'Tipo'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${showTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showTypeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 z-30 bg-white border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/60 py-2 min-w-[186px] overflow-hidden"
                        >
                          <div className="px-3 pb-1.5 pt-0.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo de expensa</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setTypeFilter(''); setShowTypeDropdown(false); }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                              !typeFilter ? 'font-semibold text-indigo-600 bg-indigo-50/60' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                              <FileText className="w-3 h-3 text-gray-400" />
                            </span>
                            Todos los tipos
                          </button>
                          {allExpenseTypes.map((t) => {
                            const Icon = TYPE_ICONS[t.name] ?? FileText;
                            const isActive = typeFilter === String(t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => { setTypeFilter(String(t.id)); setShowTypeDropdown(false); }}
                                className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                                  isActive ? 'font-semibold text-indigo-600 bg-indigo-50/60' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center ${isActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                  <Icon className={`w-3 h-3 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                                </span>
                                {t.label}
                                {t.subtypes.length > 0 && (
                                  <span className="ml-auto text-[10px] bg-purple-50 text-purple-500 border border-purple-100 rounded-full px-1.5 py-0.5 font-semibold">
                                    {t.subtypes.length}
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
                        <div className="flex items-center flex-shrink-0">
                          <div className="w-3 h-px bg-gradient-to-r from-purple-400 to-pink-400" />
                          <ChevronRight className="w-3.5 h-3.5 text-pink-400" />
                        </div>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setShowSubtypeDropdown((o) => !o); setShowTypeDropdown(false); setShowPeriodDropdown(false); setShowStatusDropdown(false); }}
                            className={`group flex items-center gap-2 px-3 py-2 text-sm rounded-xl border font-medium transition-all duration-200 cursor-pointer ${
                              subtypeFilter
                                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-md shadow-violet-200/60'
                                : 'bg-white border-purple-200 text-gray-500 hover:border-violet-400 hover:shadow-sm'
                            }`}
                          >
                            <Tag className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              subtypeFilter ? 'text-white' : 'text-purple-400 group-hover:text-violet-500'
                            }`} />
                            <span className="truncate">{availableSubtypes.find((s) => String(s.id) === subtypeFilter)?.label ?? 'Subtipo'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${showSubtypeDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {showSubtypeDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 top-full mt-2 z-30 bg-white border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/60 py-2 min-w-[180px] overflow-hidden"
                              >
                                <div className="px-3 pb-1.5 pt-0.5">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Subtipo</p>
                                  <p className="text-[11px] text-gray-400 truncate">{selectedTypeObj?.label}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setSubtypeFilter(''); setShowSubtypeDropdown(false); }}
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                                    !subtypeFilter ? 'font-semibold text-violet-600 bg-violet-50/60' : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                                    <Tag className="w-3 h-3 text-gray-400" />
                                  </span>
                                  Todos los subtipos
                                </button>
                                {availableSubtypes.map((s) => {
                                  const isActive = subtypeFilter === String(s.id);
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => { setSubtypeFilter(String(s.id)); setShowSubtypeDropdown(false); }}
                                      className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                                        isActive ? 'font-semibold text-violet-600 bg-violet-50/60' : 'text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${isActive ? 'bg-violet-100' : 'bg-gray-100'}`}>
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

              {/* Clear filters */}
              {(periodFilter || statusFilter || searchTerm || typeFilter || subtypeFilter) && (
                <button
                  type="button"
                  onClick={() => { setPeriodFilter(''); setStatusFilter(''); setSearchTerm(''); setTypeFilter(''); setSubtypeFilter(''); }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>

            {/* List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm">Cargando expensas…</p>
              </div>
            ) : displayedExpenses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                <Receipt className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">Sin expensas para los filtros seleccionados</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                      className="px-5 py-2 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 rounded-xl bg-white hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50"
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
