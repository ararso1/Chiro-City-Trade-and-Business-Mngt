/**
 * Chiro City Trade Management API client.
 * Set VITE_API_BASE in .env (e.g. http://localhost:3003) or leave empty for same-origin.
 */
const BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3003';

function getToken(): string | null {
  return localStorage.getItem('chiro_trade_token');
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as object),
  };
  const token = getToken();
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url.toString(), { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: { id: string; name: string; email: string; role: string; permissions: string[] } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    profile: () =>
      request<{ id: string; name: string; email: string; role: string; permissions: string[] }>('/auth/profile'),
  },
  reports: {
    dashboard: () => request<{
      totalTraders: number;
      activeLicenses: number;
      expiredLicenses: number;
      totalRevenue: number;
      totalViolations: number;
      openComplaints: number;
      fiscalYear: { label: string; calendarType: string } | null;
    }>('/reports/dashboard'),
    exportSummary: (from?: string, to?: string) =>
      request<{ period: object; tradersRegistered: number; businessesRegistered: number; totalPayments: number; totalRevenue: number }>(
        '/reports/export-summary',
        { params: { from: from ?? '', to: to ?? '' } }
      ),
  },
  traders: {
    list: (params?: { search?: string; status?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/traders', { params: params as Record<string, string> }),
    get: (id: string) => request<any>('/traders/' + id),
    create: (body: object) => request<any>('/traders', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>('/traders/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  },
  businesses: {
    list: (params?: { search?: string; status?: string; traderId?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/businesses', { params: params as Record<string, string> }),
    get: (id: string) => request<any>('/businesses/' + id),
    create: (body: object) => request<any>('/businesses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>('/businesses/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  },
  licenses: {
    list: (params?: { businessId?: string; traderId?: string; status?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/licenses', { params: params as Record<string, string> }),
    get: (id: string) => request<any>('/licenses/' + id),
    create: (body: object) => request<any>('/licenses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>('/licenses/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  },
  finance: {
    taxTypes: () => request<any[]>('/finance/tax-types'),
    payments: (params?: { businessId?: string; year?: string; status?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/finance/payments', { params: params as Record<string, string> }),
    revenue: (year?: string) => request<{ totalRevenue: number; paymentCount: number; year: number }>('/finance/revenue', { params: { year: year ?? '' } }),
    recordPayment: (body: object) => request<any>('/finance/payments', { method: 'POST', body: JSON.stringify(body) }),
  },
  inspections: {
    list: (params?: { businessId?: string; status?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/inspections', { params: params as Record<string, string> }),
    get: (id: string) => request<any>('/inspections/' + id),
    create: (body: { businessId: string; scheduledAt: string }) =>
      request<any>('/inspections', { method: 'POST', body: JSON.stringify(body) }),
    updateResult: (id: string, body: object) =>
      request<any>('/inspections/' + id + '/result', { method: 'PUT', body: JSON.stringify(body) }),
    addViolation: (id: string, body: { code: string; description: string; severity: string }) =>
      request<any>('/inspections/' + id + '/violations', { method: 'POST', body: JSON.stringify(body) }),
  },
  documents: {
    trader: (traderId: string) => request<any[]>('/documents/trader/' + traderId),
    business: (businessId: string) => request<any[]>('/documents/business/' + businessId),
    search: (query?: string, type?: string) =>
      request<{ traderDocuments: any[]; businessDocuments: any[] }>('/documents/search', { params: { query: query ?? '', type: type ?? '' } }),
  },
  complaints: {
    list: (params?: { status?: string; traderId?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/complaints', { params: params as Record<string, string> }),
    get: (id: string) => request<any>('/complaints/' + id),
    create: (body: object) => request<any>('/complaints', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<any>('/complaints/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  },
  notifications: {
    list: (params?: { type?: string; read?: string; skip?: number; take?: number }) =>
      request<{ items: any[]; total: number }>('/notifications', { params: params as Record<string, string> }),
    markRead: (id: string) => request<any>('/notifications/' + id + '/read', { method: 'PUT' }),
    bulkSend: (body: {
      type: string;
      title: string;
      body?: string;
      channels?: { sms?: boolean; email?: boolean; inApp?: boolean };
      expiryDate?: string;
      amount?: number;
    }) =>
      request<{ created: number; tradersCount: number }>('/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  users: {
    list: () => request<any[]>('/users'),
    roles: () => request<any[]>('/users/roles'),
    permissions: () => request<any[]>('/users/permissions'),
  },
  fiscalYear: {
    getConfig: () =>
      request<{ calendarType: 'EC' | 'GC'; activeFiscalYearId: string | null }>('/fiscal-year/config'),
    getActiveRange: () =>
      request<{ startDate: string; endDate: string; label: string; calendarType: string } | null>('/fiscal-year/active-range'),
    setConfig: (body: { calendarType?: 'EC' | 'GC'; activeFiscalYearId?: string | null }) =>
      request<{ calendarType: string; activeFiscalYearId: string | null }>('/fiscal-year/config', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    list: (calendarType?: 'EC' | 'GC') =>
      request<any[]>('/fiscal-year/list', { params: { calendarType: calendarType ?? '' } }),
    create: (body: { calendarType: 'EC' | 'GC'; label: string; startDate: string; endDate: string }) =>
      request<any>('/fiscal-year', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { label?: string; startDate?: string; endDate?: string }) =>
      request<any>('/fiscal-year/' + id, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>('/fiscal-year/' + id, { method: 'DELETE' }),
  },
};

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('chiro_trade_token', token);
  else localStorage.removeItem('chiro_trade_token');
}
