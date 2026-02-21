const API_URL = import.meta.env.VITE_API_URL as string;

export interface UserExpenseStatus {
  id: number;
  name: string;   // "pendiente" | "parcial" | "pagado" | "vencido"
  label: string;
}

export interface UserExpenseType {
  id: number;
  name: string;
  label: string;
}

export interface UserExpenseSubtype {
  id: number;
  name: string;
  label: string;
  typeId: number;
}

export interface UserExpenseLineItem {
  id: number;
  expenseId: number;
  typeId: number;
  type: UserExpenseType;
  subtypeId?: number | null;
  subtype?: UserExpenseSubtype | null;
  description?: string | null;
  amount: number;
}

export interface UserExpensePayment {
  id: number;
  expenseId: number;
  amount: number;
  paidAt: string;
  notes?: string | null;
  paymentMethod?: { label: string } | null;
}

export interface UserExpense {
  id: number;
  apartmentId?: number | null;
  apartment?: { id: number; unit: string; floor: number } | null;
  userId?: number | null;
  period: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  statusId: number;
  status: UserExpenseStatus;
  adminNotes?: string | null;
  lineItems: UserExpenseLineItem[];
  payments: UserExpensePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface LastPaymentSummary {
  id: number;
  amount: number;
  paidAt: string;
  notes?: string | null;
  paymentMethod?: { label: string } | null;
  expense: {
    id: number;
    period: string;
    apartment?: { unit: string } | null;
  };
}

export interface UserExpensesSummary {
  totalDebt: number;
  overdueDebt: number;
  pendingCount: number;
  overdueCount: number;
  lastPayment: LastPaymentSummary | null;
}

export interface GetUserExpensesParams {
  page?: number;
  limit?: number;
  statusId?: number;
  period?: string; // "YYYY-MM"
}

export interface GetUserExpensesResponse {
  expenses: UserExpense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getUserExpenses(
  token: string,
  params: GetUserExpensesParams = {}
): Promise<GetUserExpensesResponse> {
  const query = new URLSearchParams();
  if (params.page)     query.set('page',     String(params.page));
  if (params.limit)    query.set('limit',    String(params.limit));
  if (params.statusId) query.set('statusId', String(params.statusId));
  if (params.period)   query.set('period',   params.period);

  const res = await fetch(`${API_URL}/expenses?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener las expensas');
  return res.json();
}

export async function getUserExpensesSummary(token: string): Promise<UserExpensesSummary> {
  const res = await fetch(`${API_URL}/expenses/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener el resumen de expensas');
  return res.json();
}

export interface LineItemsByType {
  [typeName: string]: {
    type: UserExpenseType;
    items: UserExpenseLineItem[];
    subtotal: number;
  };
}

export interface UserExpenseDetailResponse {
  expense: UserExpense;
  lineItemsByType: LineItemsByType;
}

export async function getUserExpenseDetail(
  token: string,
  id: number
): Promise<UserExpenseDetailResponse> {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener la expensa');
  return res.json();
}
