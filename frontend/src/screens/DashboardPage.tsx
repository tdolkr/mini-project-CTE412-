import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { api, HabitDTO } from '../lib/api';
import { storage } from '../lib/storage';
import { ToastProvider, useToast } from '../components/Toast';

const weekRangeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

const addDays = (date: Date, amount: number): Date => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
};

const startOfWeek = (date: Date): Date => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const getCurrentWeekStart = () => formatLocalDate(startOfWeek(new Date()));

const getWeekRangeLabel = (startISO: string): string => {
  const startDate = parseLocalDate(startISO);
  const endDate = addDays(startDate, 6);
  return `${weekRangeFormatter.format(startDate)} – ${weekRangeFormatter.format(endDate)}`;
};

const todayIsoString = () => formatLocalDate(new Date());

const DashboardInner: FC = () => {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [habitForm, setHabitForm] = useState({ name: '', description: '' });
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitValues, setEditingHabitValues] = useState({ name: '', description: '' });
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getCurrentWeekStart());

  const user = storage.getUser();
  const today = todayIsoString();

  const weekDays = useMemo(() => {
    const startDate = parseLocalDate(selectedWeekStart);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(startDate, index);
      return {
        iso: formatLocalDate(date),
        weekday: weekdayFormatter.format(date),
        label: shortDateFormatter.format(date)
      };
    });
  }, [selectedWeekStart]);

  const refreshData = useCallback(
    async (weekStart: string) => {
      try {
        setLoading(true);
        const startDate = parseLocalDate(weekStart);
        const endDate = addDays(startDate, 6);
        const habitList = await api.listHabits({
          start: formatLocalDate(startDate),
          end: formatLocalDate(endDate)
        });
        setHabits(habitList);
      } catch (error: any) {
        showToast(error?.message ?? 'Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void refreshData(selectedWeekStart);
  }, [selectedWeekStart, refreshData]);

  const weeklyStats = useMemo(() => {
    const totalSlots = habits.length * weekDays.length;
    let completedSlots = 0;

    const dailyBreakdown = weekDays.map((day) => {
      const completedForDay = habits.filter((habit) =>
        habit.entries.some((entry) => entry.date === day.iso && entry.completed)
      ).length;
      completedSlots += completedForDay;
      return {
        day: day.iso,
        label: day.weekday,
        count: completedForDay,
        percent: habits.length === 0 ? 0 : Math.round((completedForDay / habits.length) * 100)
      };
    });

    return {
      totalSlots,
      completedSlots,
      percent: totalSlots === 0 ? 0 : Math.round((completedSlots / totalSlots) * 100),
      dailyBreakdown
    };
  }, [habits, weekDays]);

  const startEditingHabit = (habit: HabitDTO) => {
    setEditingHabitId(habit.id);
    setEditingHabitValues({
      name: habit.name,
      description: habit.description ?? ''
    });
  };

  const cancelHabitEdit = () => {
    setEditingHabitId(null);
    setEditingHabitValues({ name: '', description: '' });
  };

  const handleCreateHabit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!habitForm.name.trim()) {
      showToast('Habit name is required', 'error');
      return;
    }
    try {
      await api.createHabit({
        name: habitForm.name.trim(),
        description: habitForm.description.trim() || null
      });
      setHabitForm({ name: '', description: '' });
      showToast('Habit added', 'success');
      await refreshData(selectedWeekStart);
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to create habit', 'error');
    }
  };

  const handleUpdateHabit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingHabitId) {
      return;
    }
    const trimmedName = editingHabitValues.name.trim();
    const trimmedDescription = editingHabitValues.description.trim();
    if (!trimmedName) {
      showToast('Habit name is required', 'error');
      return;
    }
    try {
      await api.updateHabit(editingHabitId, {
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : null
      });
      showToast('Habit updated', 'success');
      cancelHabitEdit();
      await refreshData(selectedWeekStart);
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to update habit', 'error');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!window.confirm('Delete this habit?')) {
      return;
    }
    try {
      if (editingHabitId === habitId) {
        cancelHabitEdit();
      }
      await api.deleteHabit(habitId);
      showToast('Habit removed', 'info');
      await refreshData(selectedWeekStart);
    } catch (error: any) {
      showToast(error?.message ?? 'Failed to delete habit', 'error');
    }
  };

  const handleToggleHabitDay = async (habit: HabitDTO, date: string) => {
    const isCompleted = habit.entries.some((entry) => entry.date === date && entry.completed);

    setHabits((prev) =>
      prev.map((item) => {
        if (item.id !== habit.id) {
          return item;
        }
        const withoutDate = item.entries.filter((entry) => entry.date !== date);
        const entries = isCompleted ? withoutDate : [...withoutDate, { date, completed: true }];
        return { ...item, entries };
      })
    );

    try {
      if (isCompleted) {
        await api.clearHabit(habit.id, date);
        showToast('Check-in removed', 'info');
      } else {
        await api.markHabit(habit.id, { date, completed: true });
        showToast('Check-in saved', 'success');
      }
    } catch (error: any) {
      showToast(error?.message ?? 'Unable to update habit', 'error');
      await refreshData(selectedWeekStart);
    }
  };

  const goToPreviousWeek = () => {
    setSelectedWeekStart((prev) => formatLocalDate(addDays(parseLocalDate(prev), -7)));
  };

  const goToNextWeek = () => {
    setSelectedWeekStart((prev) => formatLocalDate(addDays(parseLocalDate(prev), 7)));
  };

  const goToCurrentWeek = () => {
    setSelectedWeekStart(getCurrentWeekStart());
  };

  const isCurrentWeek = selectedWeekStart === getCurrentWeekStart();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user.name.split(' ')[0] || user.name}
          </h1>
          <p className="text-sm text-slate-600">
            Plan your weekly habits and mark each day you complete them.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={goToPreviousWeek}
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-200"
              >
                ← Previous week
              </button>
              <button
                type="button"
                onClick={goToCurrentWeek}
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-200 disabled:opacity-50"
                disabled={isCurrentWeek}
              >
                This week
              </button>
              <button
                type="button"
                onClick={goToNextWeek}
                className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-200"
              >
                Next week →
              </button>
            </div>
            <button
              type="button"
              onClick={() => refreshData(selectedWeekStart)}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Sync data
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

        <main>
          <section className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Weekly Habit Tracker</h2>
              </div>
              <span className="text-sm font-medium text-slate-700">{getWeekRangeLabel(selectedWeekStart)}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Weekly completion</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{weeklyStats.percent}%</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all"
                    style={{ width: `${weeklyStats.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {weeklyStats.completedSlots} of {weeklyStats.totalSlots} check-ins logged
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Habits tracked</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{habits.length}</p>
                <p className="mt-2 text-xs text-slate-500">Keep it focused and meaningful.</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Today&apos;s streak</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {
                    habits.filter((habit) =>
                      habit.entries.some((entry) => entry.date === today && entry.completed)
                    ).length
                  }
                </p>
                <p className="mt-2 text-xs text-slate-500">Habits completed today</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {weeklyStats.dailyBreakdown.map((day) => (
                <div
                  key={day.day}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    day.day === today ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">{day.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{day.count}</p>
                  <p className="text-[11px] text-slate-500">{day.percent}% complete</p>
                </div>
              ))}
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
              <button
                type="submit"
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Add habit
              </button>
            </form>

            <div className="overflow-x-auto">
              {loading ? (
                <p className="px-3 py-6 text-sm text-slate-600">Loading weekly habits…</p>
              ) : habits.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  Add a habit above to start tracking your week.
                </p>
              ) : (
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="min-w-[220px] border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Habit
                      </th>
                      {weekDays.map((day) => {
                        const isToday = day.iso === today;
                        return (
                          <th
                            key={day.iso}
                            className={`min-w-[80px] border-b border-slate-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide ${
                              isToday ? 'bg-sky-50 text-sky-600' : 'text-slate-500'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{day.weekday}</span>
                              <span className="text-[11px] font-normal text-slate-500">{day.label}</span>
                            </div>
                          </th>
                        );
                      })}
                      <th className="min-w-[90px] border-b border-slate-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Weekly score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {habits.map((habit) => {
                      const weeklyCount = weekDays.filter((day) =>
                        habit.entries.some((entry) => entry.date === day.iso && entry.completed)
                      ).length;
                      const weeklyPercent =
                        weekDays.length === 0 ? 0 : Math.round((weeklyCount / weekDays.length) * 100);

                      return (
                        <tr key={habit.id} className="bg-white">
                          <td className="align-top px-4 py-4">
                            {editingHabitId === habit.id ? (
                              <form onSubmit={handleUpdateHabit} className="flex flex-col gap-2">
                                <input
                                  value={editingHabitValues.name}
                                  onChange={(event) =>
                                    setEditingHabitValues((prev) => ({ ...prev, name: event.target.value }))
                                  }
                                  placeholder="Habit name"
                                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  required
                                />
                                <input
                                  value={editingHabitValues.description}
                                  onChange={(event) =>
                                    setEditingHabitValues((prev) => ({
                                      ...prev,
                                      description: event.target.value
                                    }))
                                  }
                                  placeholder="Short note (optional)"
                                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="submit"
                                    className="rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelHabitEdit}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div>
                                  <p className="font-medium text-slate-900">{habit.name}</p>
                                  {habit.description && (
                                    <p className="text-sm text-slate-600">{habit.description}</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => startEditingHabit(habit)}
                                    className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteHabit(habit.id)}
                                    className="rounded-md border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          {weekDays.map((day) => {
                            const isToday = day.iso === today;
                            const isCompleted = habit.entries.some(
                              (entry) => entry.date === day.iso && entry.completed
                            );
                            const buttonBase =
                              'flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors';
                            const buttonVisual = isCompleted
                              ? 'border-sky-500 bg-sky-500 text-white shadow-sm hover:bg-sky-600'
                              : 'border-slate-300 text-slate-500 hover:border-sky-400 hover:text-sky-600';
                            const todayRing = isToday ? 'ring-2 ring-offset-2 ring-sky-200' : '';

                            return (
                              <td key={day.iso} className={`px-3 py-4 text-center ${isToday ? 'bg-sky-50' : ''}`}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleHabitDay(habit, day.iso)}
                                  className={[buttonBase, buttonVisual, todayRing].join(' ')}
                                  aria-pressed={isCompleted}
                                  aria-label={`Mark ${habit.name} on ${day.weekday}`}
                                  title={`${habit.name} • ${day.label}`}
                                >
                                  {isCompleted ? '✓' : ''}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-3 py-4 text-center text-sm font-semibold text-slate-700">
                            {weeklyCount}/{weekDays.length}
                            <span className="block text-xs font-normal text-slate-500">{weeklyPercent}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
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
