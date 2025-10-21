import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { api, HabitDTO, Todo } from '../lib/api';
import { storage } from '../lib/storage';
import { ToastProvider, useToast } from '../components/Toast';

const todayISO = () => new Date().toISOString().slice(0, 10);

const DashboardInner: FC = () => {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [habitForm, setHabitForm] = useState({ name: '', description: '' });
  const [todoTitle, setTodoTitle] = useState('');

  const user = storage.getUser();

  const refreshData = async () => {
    try {
      setLoading(true);
      const [habitList, todoList] = await Promise.all([api.listHabits(), api.listTodos()]);
      setHabits(habitList);
      setTodos(todoList);
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const hasCompletedToday = (habit: HabitDTO) => {
    return habit.entries.some((entry) => entry.date === todayISO() && entry.completed);
  };

  const handleCreateHabit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!habitForm.name.trim()) {
      showToast('Habit name is required', 'error');
      return;
    }
    try {
      await api.createHabit({
        name: habitForm.name,
        description: habitForm.description.trim() || null
      });
      setHabitForm({ name: '', description: '' });
      showToast('Habit added', 'success');
      await refreshData();
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to create habit', 'error');
    }
  };

  const handleToggleHabit = async (habit: HabitDTO) => {
    try {
      if (hasCompletedToday(habit)) {
        await api.clearHabit(habit.id, todayISO());
        showToast('Marked incomplete for today', 'info');
      } else {
        await api.markHabit(habit.id, { date: todayISO(), completed: true });
        showToast('Nice work! Habit completed for today', 'success');
      }
      await refreshData();
    } catch (error: any) {
      showToast(error?.message ?? 'Unable to update habit', 'error');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!window.confirm('Delete this habit?')) {
      return;
    }
    try {
      await api.deleteHabit(habitId);
      showToast('Habit removed', 'info');
      await refreshData();
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to delete habit', 'error');
    }
  };

  const handleCreateTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!todoTitle.trim()) {
      showToast('Todo title is required', 'error');
      return;
    }
    try {
      await api.createTodo({ title: todoTitle.trim() });
      setTodoTitle('');
      showToast('Todo added', 'success');
      await refreshData();
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to add todo', 'error');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await api.deleteTodo(todoId);
      showToast('Todo deleted', 'info');
      await refreshData();
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to delete todo', 'error');
    }
  };

  const completionRate = useMemo(() => {
    const total = habits.reduce((acc, habit) => acc + habit.entries.length, 0);
    const completed = habits.reduce(
      (acc, habit) => acc + habit.entries.filter((entry) => entry.completed).length,
      0
    );
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [habits]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0] || user.name}</h1>
          <p className="text-sm text-slate-600">Mark today&apos;s habits and jot down quick todos.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span>Last 14 days done: <strong>{completionRate}%</strong></span>
            <button
              type="button"
              onClick={refreshData}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                storage.clearAuth();
                window.location.replace('/auth');
              }}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">Habits</h2>
              <p className="text-sm text-slate-600">Tap a habit to set today as done.</p>
            </div>
            <form onSubmit={handleCreateHabit} className="grid gap-3 md:grid-cols-[1.2fr,1fr,auto]">
              <input
                value={habitForm.name}
                onChange={(event) => setHabitForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Habit name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <input
                value={habitForm.description}
                onChange={(event) => setHabitForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Short note (optional)"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                Add
              </button>
            </form>

            {loading ? (
              <p className="text-sm text-slate-600">Loading habits…</p>
            ) : habits.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                No habits yet. Add one above to get started.
              </p>
            ) : (
              <ul className="space-y-3">
                {habits.map((habit) => {
                  const completedToday = hasCompletedToday(habit);
                  return (
                    <li key={habit.id} className="rounded-md border border-slate-200 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{habit.name}</p>
                        {habit.description && <p className="text-sm text-slate-600">{habit.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleHabit(habit)}
                          className={`rounded-md px-3 py-2 text-xs font-semibold ${
                            completedToday
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {completedToday ? 'Completed today' : 'Mark today'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="rounded-md border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Todos</h2>
              <p className="text-sm text-slate-600">Keep small reminders linked to your habits.</p>
            </div>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <input
                value={todoTitle}
                onChange={(event) => setTodoTitle(event.target.value)}
                placeholder="Add a todo"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                Add
              </button>
            </form>
            {loading ? (
              <p className="text-sm text-slate-600">Loading todos…</p>
            ) : todos.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                No todos yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <span className="text-sm text-slate-700">{todo.title}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export const DashboardPage: FC = () => {
  const token = storage.getToken();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return (
    <ToastProvider>
      <DashboardInner />
    </ToastProvider>
  );
};
