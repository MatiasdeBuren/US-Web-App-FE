import { useState, useEffect, useCallback } from 'react';
import {
  getExpenses,
  getExpenseTypes,
  getExpenseStatuses,
  getPaymentMethods,
  deleteExpense,
  type Expense,
  type ExpenseType,
  type ExpenseStatus,
  type PaymentMethod,
} from '../api_calls/expenses';
import { getAdminApartments, type AdminApartment } from '../api_calls/admin';


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
  selectedApartmentId: number | null;
  setSelectedApartmentId: (id: number | null) => void;
  showStatusFilter: boolean;
  setShowStatusFilter: (open: boolean) => void;
  showTypeFilter: boolean;
  setShowTypeFilter: (open: boolean) => void;
  showApartmentFilter: boolean;
  setShowApartmentFilter: (open: boolean) => void;

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

  displayedExpenses: Expense[];

  getCurrentStatusLabel: () => string;
  getCurrentTypeLabel: () => string;
  getCurrentApartmentLabel: () => string;

  loadExpenses: () => void;
  handlePaymentRegistered: (updated: Expense) => void;
  handleDeleteConfirm: () => Promise<void>;
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
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showApartmentFilter, setShowApartmentFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [expenseToPayment, setExpenseToPayment] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

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
      const result = await getExpenses(token, {
        page: currentPage,
        limit: 10,
        statusId: selectedStatusId ?? undefined,
        apartmentId: selectedApartmentId ?? undefined,
      });
      setExpenses(result.expenses);
      setTotalCount(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, selectedStatusId, selectedApartmentId]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatusId, selectedTypeId, selectedApartmentId, searchTerm]);

  const displayedExpenses = expenses.filter((exp) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      exp.apartment?.unit.toLowerCase().includes(q) ||
      exp.user?.name.toLowerCase().includes(q) ||
      exp.user?.email.toLowerCase().includes(q) ||
      String(exp.apartment?.floor).includes(q);

    const matchType =
      !selectedTypeId || exp.lineItems.some((li) => li.typeId === selectedTypeId);

    return matchSearch && matchType;
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

  const clearFilters = () => {
    setSelectedStatusId(null);
    setSelectedTypeId(null);
    setSelectedApartmentId(null);
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
    selectedApartmentId,
    setSelectedApartmentId,
    showStatusFilter,
    setShowStatusFilter,
    showTypeFilter,
    setShowTypeFilter,
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
  };
}
