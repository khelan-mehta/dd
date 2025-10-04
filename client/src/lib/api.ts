const API_BASE_URL = 'http://localhost:3000/api/v1';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    country: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/profile');
  }

  // Users
  async createUser(data: any): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUsers(): Promise<any[]> {
    return this.request('/users');
  }

  async getUserById(id: string): Promise<any> {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any): Promise<any> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async assignManager(userId: string, managerId: string): Promise<any> {
    return this.request(`/users/${userId}/assign-manager`, {
      method: 'PUT',
      body: JSON.stringify({ managerId }),
    });
  }

  async deactivateUser(id: string): Promise<void> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Expenses
  async submitExpense(data: any): Promise<any> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadReceipt(file: File): Promise<any> {
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch(`${API_BASE_URL}/expenses/upload-receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async getMyExpenses(status?: string): Promise<any[]> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/expenses/my-expenses${query}`);
  }

  async getTeamExpenses(): Promise<any[]> {
    return this.request('/expenses/team-expenses');
  }

  async getAllExpenses(): Promise<any[]> {
    return this.request('/expenses/all');
  }

  async getExpenseById(id: string): Promise<any> {
    return this.request(`/expenses/${id}`);
  }

  async updateExpense(id: string, data: any): Promise<any> {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Approvals
  async createApprovalRule(data: any): Promise<any> {
    return this.request('/approvals/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApprovalRules(): Promise<any[]> {
    return this.request('/approvals/rules');
  }

  async updateApprovalRule(id: string, data: any): Promise<any> {
    return this.request(`/approvals/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPendingApprovals(): Promise<any[]> {
    return this.request('/approvals/pending');
  }

  async processApproval(requestId: string, status: 'approved' | 'rejected', comments?: string): Promise<any> {
    return this.request(`/approvals/process/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ status, comments }),
    });
  }

  async overrideApproval(expenseId: string, status: 'approved' | 'rejected', comments?: string): Promise<any> {
    return this.request(`/approvals/override/${expenseId}`, {
      method: 'POST',
      body: JSON.stringify({ status, comments }),
    });
  }
}

export const api = new ApiClient();
