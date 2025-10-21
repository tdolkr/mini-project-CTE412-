import { Link } from 'react-router-dom';
import type { FC } from 'react';

export const LandingPage: FC = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-12 px-6 py-16">
        <header className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Habit tracker</p>
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">Keep up with habits and quick todos</h1>
          <p className="text-base text-slate-600">
            Add habits you want to follow each day and log simple todos to support them.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ready to get started?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Create an account or log in to open your dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="rounded-md bg-sky-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-sky-500"
              >
                Authentication Portal
              </Link>
              <Link
                to="/dashboard"
                className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Dashboard
              </Link>
            </div>
          </section>

          <aside className="rounded-lg bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Tech at a glance</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Express API with JWT login</li>
              <li>Postgres stores habits and todos</li>
              <li>React + Tailwind frontend</li>
              <li>Docker &amp; GitHub Actions CI</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
};
