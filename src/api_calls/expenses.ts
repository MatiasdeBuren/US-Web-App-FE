const API_URL = import.meta.env.VITE_API_URL as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExpenseStatus {
  id: number;
  name: string; // "pendiente" | "parcial" | "pagado" | "vencido"
  label: string;
  color?: string;
}

export interface ExpenseType {
  id: number;
  name: string;
  label: string;
  icon?: string;
  subtypes?: ExpenseSubtype[];
}

export interface ExpenseSubtype {
  id: number;
  name: string;
  label: string;
  icon?: string;
  typeId: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  label: string;
}

export interface ExpenseLineItem {
  id: number;
  expenseId: number;
  typeId: number;
  type: ExpenseType;
  subtypeId?: number | null;
  subtype?: ExpenseSubtype | null;
  description?: string | null;
  amount: number;
}

export interface ExpensePayment {
  id: number;
  expenseId: number;
  amount: number;
  paymentMethodId?: number | null;
  paymentMethod?: PaymentMethod | null;
  registeredById: number;
  registeredBy: {
    id: number;
    name: string;
    email: string;
  };
  paidAt: string;
  notes?: string | null;
  createdAt: string;
}

export interface Expense {
  id: number;
  apartmentId?: number | null;
  apartment?: {
    id: number;
    unit: string;
    floor: number;
  } | null;
  userId?: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  period: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  statusId: number;
  status: ExpenseStatus;
  adminNotes?: string | null;
  lineItems: ExpenseLineItem[];
  payments: ExpensePayment[];
  createdAt: string;
  updatedAt: string;
}

// ─── GET helpers ─────────────────────────────────────────────────────────────

export async function getExpenseTypes(token: string): Promise<ExpenseType[]> {
  const res = await fetch(`${API_URL}/admin/expenses/types`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener tipos de expensa');
  const data = await res.json();
  return data.types;
}

export async function getExpenseStatuses(token: string): Promise<ExpenseStatus[]> {
  const res = await fetch(`${API_URL}/admin/expenses/statuses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener estados de expensa');
  const data = await res.json();
  return data.statuses;
}

export async function getPaymentMethods(token: string): Promise<PaymentMethod[]> {
  const res = await fetch(`${API_URL}/admin/expenses/payment-methods`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener métodos de pago');
  const data = await res.json();
  return data.paymentMethods;
}

export interface GetExpensesParams {
  page?: number;
  limit?: number;
  statusId?: number;
  apartmentId?: number;
  userId?: number;
  period?: string; // "YYYY-MM"
}

export interface GetExpensesResponse {
  expenses: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getExpenses(
  token: string,
  params: GetExpensesParams = {}
): Promise<GetExpensesResponse> {
  const query = new URLSearchParams();
  if (params.page)        query.set('page',        String(params.page));
  if (params.limit)       query.set('limit',       String(params.limit));
  if (params.statusId)    query.set('statusId',    String(params.statusId));
  if (params.apartmentId) query.set('apartmentId', String(params.apartmentId));
  if (params.userId)      query.set('userId',      String(params.userId));
  if (params.period)      query.set('period',      params.period);

  const res = await fetch(`${API_URL}/admin/expenses?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener expensas');
  return res.json();
}

// ─── Create / Update / Delete ─────────────────────────────────────────────────

export interface CreateExpenseLineItemInput {
  typeId: number;
  subtypeId?: number | null;
  description?: string | null;
  amount: number;
}

export interface CreateExpenseInput {
  apartmentId?: number | null;
  userId?: number | null;
  period: string;       // ISO date string (first of month)
  dueDate: string;      // ISO date string
  adminNotes?: string | null;
  lineItems: CreateExpenseLineItemInput[];
}

export async function createExpense(token: string, data: CreateExpenseInput): Promise<Expense> {
  const res = await fetch(`${API_URL}/admin/expenses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al crear la expensa');
  return json.expense;
}

export async function deleteExpense(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/admin/expenses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Error al eliminar la expensa');
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface RegisterPaymentInput {
  amount: number;
  paymentMethodId?: number | null;
  paidAt?: string;
  notes?: string | null;
}

export async function registerExpensePayment(
  token: string,
  expenseId: number,
  data: RegisterPaymentInput
): Promise<Expense> {
  const res = await fetch(`${API_URL}/admin/expenses/${expenseId}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al registrar el pago');
  return json.expense;
}

export async function deleteExpensePayment(
  token: string,
  expenseId: number,
  paymentId: number
): Promise<Expense> {
  const res = await fetch(`${API_URL}/admin/expenses/${expenseId}/payments/${paymentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al eliminar el pago');
  return json.expense;
}
