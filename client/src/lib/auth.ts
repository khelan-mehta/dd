export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  firstName?: string;
  lastName?: string;
}

export const AuthService = {
  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  },

  isAdmin(): boolean {
    return this.hasRole('admin');
  },

  isManager(): boolean {
    return this.hasRole('manager');
  },

  isEmployee(): boolean {
    return this.hasRole('employee');
  },
};
