import { useState, useEffect, useCallback } from 'react';
import {
  getExpenses,
  getExpenseTypes,
  getExpenseStatuses,
  getPaymentMethods,
  deleteExpense,
  deleteExpensePayment,
  type Expense,
  type ExpenseType,
  type ExpenseStatus,
  type PaymentMethod,
} from '../api_calls/expenses';
import { getAdminApartments, type AdminApartment } from '../api_calls/admin';
import type { PeriodFilterOption } from '../components/ExpensePeriodFilterModal';


interface UseExpensesManagementOptions {
  isOpen: boolean;
  token: string;
}

export interface UseExpensesManagementReturn {
  expenses: Expense[];
  expenseTypes: ExpenseType[];
  expenseStatuses: ExpenseStatus[];
  paymentMethods: PaymentMethod[];
  apartments: AdminApartment[];
  loading: boolean;
  isDeleting: boolean;

  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedStatusId: number | null;
  setSelectedStatusId: (id: number | null) => void;
  selectedTypeId: number | null;
  setSelectedTypeId: (id: number | null) => void;
  selectedSubtypeId: number | null;
  setSelectedSubtypeId: (id: number | null) => void;
  selectedApartmentId: number | null;
  setSelectedApartmentId: (id: number | null) => void;
  showStatusFilter: boolean;
  setShowStatusFilter: (open: boolean) => void;
  showTypeFilter: boolean;
  setShowTypeFilter: (open: boolean) => void;
  showSubtypeFilter: boolean;
  setShowSubtypeFilter: (open: boolean) => void;
  showApartmentFilter: boolean;
  setShowApartmentFilter: (open: boolean) => void;
  selectedPeriodOption: PeriodFilterOption | null;
  setSelectedPeriodOption: (opt: PeriodFilterOption | null) => void;
  showPeriodModal: boolean;
  setShowPeriodModal: (open: boolean) => void;

  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  totalCount: number;

  showCreate: boolean;
  setShowCreate: (open: boolean) => void;
  expenseToPayment: Expense | null;
  setExpenseToPayment: (expense: Expense | null) => void;
  expenseToDelete: Expense | null;
  setExpenseToDelete: (expense: Expense | null) => void;
  expenseToEdit: Expense | null;
  setExpenseToEdit: (expense: Expense | null) => void;
  handleExpenseEdited: (updated: Expense) => void;

  displayedExpenses: Expense[];

  getCurrentStatusLabel: () => string;
  getCurrentTypeLabel: () => string;
  getCurrentApartmentLabel: () => string;

  loadExpenses: () => void;
  handlePaymentRegistered: (updated: Expense) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeletePayment: (expenseId: number, paymentId: number) => Promise<void>;
  deletingPaymentIds: Set<number>;
  clearFilters: () => void;
}

export function useExpensesManagement({
  isOpen,
  token,
}: UseExpensesManagementOptions): UseExpensesManagementReturn {

  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenseStatuses, setExpenseStatuses] = useState<ExpenseStatus[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [apartments, setApartments] = useState<AdminApartment[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<number | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showSubtypeFilter, setShowSubtypeFilter] = useState(false);
  const [showApartmentFilter, setShowApartmentFilter] = useState(false);
  const [selectedPeriodOption, setSelectedPeriodOption] = useState<PeriodFilterOption | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [expenseToPayment, setExpenseToPayment] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [deletingPaymentIds, setDeletingPaymentIds] = useState<Set<number>>(new Set());

  const loadMeta = useCallback(async () => {
    try {
      const [types, statuses, methods, apts] = await Promise.all([
        getExpenseTypes(token),
        getExpenseStatuses(token),
        getPaymentMethods(token),
        getAdminApartments(token),
      ]);
      setExpenseTypes(types);
      setExpenseStatuses(statuses);
      setPaymentMethods(methods);
      setApartments(apts.slice().sort((a, b) => a.unit.localeCompare(b.unit)));
    } catch (err) {
      console.error('Error loading expense metadata:', err);
    }
  }, [token]);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const isRange = selectedPeriodOption?.mode === 'range';
      const result = await getExpenses(token, {
        page: isRange ? 1 : currentPage,
        limit: isRange ? 500 : 10,
        statusId: selectedStatusId ?? undefined,
        apartmentId: selectedApartmentId ?? undefined,
        period: selectedPeriodOption?.mode === 'single' ? selectedPeriodOption.period : undefined,
      });
      setExpenses(result.expenses);
      setTotalCount(result.pagination.total);
      setTotalPages(isRange ? 1 : result.pagination.totalPages);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, selectedStatusId, selectedApartmentId, selectedPeriodOption]);

  useEffect(() => {
    if (isOpen) {
      loadMeta();
    }
  }, [isOpen, loadMeta]);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen, loadExpenses]);

  // reset subtype when type changes
  useEffect(() => {
    setSelectedSubtypeId(null);
  }, [selectedTypeId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatusId, selectedTypeId, selectedSubtypeId, selectedApartmentId, searchTerm, selectedPeriodOption]);

  const displayedExpenses = expenses.filter((exp) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      exp.apartment?.unit.toLowerCase().includes(q) ||
      String(exp.apartment?.floor).includes(q);

    const matchType =
      !selectedTypeId || exp.lineItems.some((li) => li.typeId === selectedTypeId);

    const matchSubtype =
      !selectedSubtypeId || exp.lineItems.some((li) => li.subtypeId === selectedSubtypeId);

    const matchPeriod = (() => {
      if (!selectedPeriodOption || selectedPeriodOption.mode === 'all') return true;
      if (selectedPeriodOption.mode === 'range' && selectedPeriodOption.periodFrom && selectedPeriodOption.periodTo) {
        const expPeriod = exp.period.substring(0, 7); // extract "YYYY-MM" from ISO date string
        return expPeriod >= selectedPeriodOption.periodFrom && expPeriod <= selectedPeriodOption.periodTo;
      }
      return true;
    })();

    return matchSearch && matchType && matchSubtype && matchPeriod;
  });

  const getCurrentApartmentLabel = () => {
    if (!selectedApartmentId) return 'Todos los deptos.';
    const apt = apartments.find((a) => a.id === selectedApartmentId);
    return apt ? `Depto. ${apt.unit}` : 'Departamento';
  };

  const getCurrentStatusLabel = () => {
    if (!selectedStatusId) return 'Todos los estados';
    return expenseStatuses.find((s) => s.id === selectedStatusId)?.label ?? 'Estado';
  };

  const getCurrentTypeLabel = () => {
    if (!selectedTypeId) return 'Todos los tipos';
    return expenseTypes.find((t) => t.id === selectedTypeId)?.label ?? 'Tipo';
  };


  const handlePaymentRegistered = (updated: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleExpenseEdited = (updated: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setExpenseToEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(token, expenseToDelete.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      setTotalCount((n) => n - 1);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePayment = async (expenseId: number, paymentId: number) => {
    setDeletingPaymentIds((prev) => new Set(prev).add(paymentId));
    try {
      const updated = await deleteExpensePayment(token, expenseId, paymentId);
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      console.error('Error deleting payment:', err);
    } finally {
      setDeletingPaymentIds((prev) => {
        const next = new Set(prev);
        next.delete(paymentId);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSelectedStatusId(null);
    setSelectedTypeId(null);
    setSelectedSubtypeId(null);
    setSelectedApartmentId(null);
    setSelectedPeriodOption(null);
    setSearchTerm('');
  };


  return {
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
    expenseToEdit,
    setExpenseToEdit,
    displayedExpenses,
    getCurrentStatusLabel,
    getCurrentTypeLabel,
    getCurrentApartmentLabel,
    loadExpenses,
    handlePaymentRegistered,
    handleDeleteConfirm,
    handleDeletePayment,
    handleExpenseEdited,
    deletingPaymentIds,
    clearFilters,
  };
}
