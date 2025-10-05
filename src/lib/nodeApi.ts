// Node.js API Client
import { API_BASE_URL, AUTH_TOKEN_KEY, WORKSPACE_ID_KEY } from '../config/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class NodeApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private workspaceId: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    this.workspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  setWorkspaceId(workspaceId: string) {
    this.workspaceId = workspaceId;
    localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
  }

  getToken() {
    return this.token;
  }

  getWorkspaceId() {
    return this.workspaceId;
  }

  clearAuth() {
    this.token = null;
    this.workspaceId = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_ID_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = new URL(endpoint, this.baseUrl);
    
    // Add workspaceId to query params for authenticated requests
    if (this.token && this.workspaceId && !endpoint.includes('auth') && !endpoint.includes('workspaces?')) {
      url.searchParams.set('workspaceId', this.workspaceId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, displayName: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    this.setToken(response.token);
    this.setWorkspaceId(response.user.defaultWorkspace);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    this.setWorkspaceId(response.user.defaultWorkspace);
    return response;
  }

  // Workspace endpoints
  async getWorkspaces() {
    return this.request<{ workspaces: any[] }>('/workspaces');
  }

  async createWorkspace(name: string) {
    return this.request<{ workspaceId: string; name: string }>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getWorkspaceMembers(workspaceId: string) {
    return this.request<{ members: any[] }>(`/workspaces/${workspaceId}/members`);
  }

  async inviteMember(workspaceId: string, email: string, role: string) {
    return this.request<{ message: string }>(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    return this.request<{ message: string }>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(workspaceId: string, memberId: string) {
    return this.request<{ message: string }>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Transaction endpoints
  async getTransactions(params?: { startDate?: string; endDate?: string; type?: string; category?: string }) {
    const queryParams = new URLSearchParams(params as any);
    return this.request<{ transactions: any[] }>(`/transactions?${queryParams}`);
  }

  async createTransaction(data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description?: string;
    date: string;
  }) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: Partial<any>) {
    return this.request<{ message: string }>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Budget endpoints
  async getBudgets() {
    return this.request<{ budgets: any[] }>('/budgets');
  }

  async createBudget(data: {
    category: string;
    amount: number;
    period: 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
  }) {
    return this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: string) {
    return this.request<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Goal endpoints
  async getGoals() {
    return this.request<{ goals: any[] }>('/goals');
  }

  async createGoal(data: {
    name: string;
    targetAmount: number;
    deadline: string;
  }) {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async contributeToGoal(id: string, amount: number) {
    return this.request<{ message: string; amount: number; newTotal: number }>(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async deleteGoal(id: string) {
    return this.request<{ message: string }>(`/goals/${id}`, {
      method: 'DELETE',
    });
  }
}

export const nodeApi = new NodeApiClient();
