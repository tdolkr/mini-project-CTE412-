const TOKEN_KEY = 'tasks_api_token';
const USER_KEY = 'tasks_api_user';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
}

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setAuth(token: string, user: StoredUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
