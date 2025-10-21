import { useState } from 'react';
import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import { useToast, ToastProvider } from '../components/Toast';

interface AuthFormState {
  email: string;
  password: string;
  name?: string;
  loading: boolean;
}

const AuthForms: FC = () => {
  const { showToast } = useToast();
  const [registerState, setRegisterState] = useState<AuthFormState>({
    email: '',
    password: '',
    name: '',
    loading: false
  });
  const [loginState, setLoginState] = useState<AuthFormState>({
    email: '',
    password: '',
    loading: false
  });

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await api.register({
        email: registerState.email,
        password: registerState.password,
        name: registerState.name ?? ''
      });
      storage.setAuth(response.token, response.user);
      showToast(`Welcome, ${response.user.name}!`, 'success');
      window.location.replace('/dashboard');
    } catch (error: any) {
      showToast(error?.message ?? 'Registration failed', 'error');
    } finally {
      setRegisterState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await api.login({
        email: loginState.email,
        password: loginState.password
      });
      storage.setAuth(response.token, response.user);
      showToast(`Signed in as ${response.user.name}`, 'success');
      window.location.replace('/dashboard');
    } catch (error: any) {
      showToast(error?.message ?? 'Login failed', 'error');
    } finally {
      setLoginState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6">
        <header className="text-center space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Sign in</p>
          <h1 className="text-3xl font-bold text-slate-900">Access your habit tracker</h1>
          <p className="text-sm text-slate-600">
            Register once or log in to see your habits and todos.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <form onSubmit={handleRegister} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Register</h2>
            <label className="text-sm text-slate-700">
              Email
              <input
                type="email"
                required
                value={registerState.email}
                onChange={(event) => setRegisterState((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </label>
            <label className="text-sm text-slate-700">
              Name
              <input
                type="text"
                required
                value={registerState.name}
                onChange={(event) => setRegisterState((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Alex"
              />
            </label>
            <label className="text-sm text-slate-700">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={registerState.password}
                onChange={(event) => setRegisterState((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Minimum 8 characters"
              />
            </label>
            <button
              type="submit"
              disabled={registerState.loading}
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-70"
            >
              {registerState.loading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <form onSubmit={handleLogin} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Log in</h2>
            <label className="text-sm text-slate-700">
              Email
              <input
                type="email"
                required
                value={loginState.email}
                onChange={(event) => setLoginState((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </label>
            <label className="text-sm text-slate-700">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={loginState.password}
                onChange={(event) => setLoginState((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={loginState.loading}
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
            >
              {loginState.loading ? 'Signing in…' : 'Log in'}
            </button>
            <p className="text-xs text-slate-500">
              Tokens are stored in local storage. Use the dashboard log-out button if you are on a shared device.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
};

export const AuthPage: FC = () => {
  const existingUser = storage.getUser();
  if (existingUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ToastProvider>
      <AuthForms />
    </ToastProvider>
  );
};
