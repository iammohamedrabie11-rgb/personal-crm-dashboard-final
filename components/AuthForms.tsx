"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  login,
  signUp,
  requestPasswordReset,
  updatePassword,
  type AuthFormState,
} from "@/app/auth/actions";

const initialState: AuthFormState = {};

function withNext(path: string, next: string) {
  return next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

function AuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            CRM
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="text-xs text-slate-400">Business Management</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

function AuthMessage({ state, message }: { state: AuthFormState; message?: string }) {
  const text = state.error ?? state.message ?? message;
  if (!text) return null;

  const tone = state.error
    ? "border-rose-700/50 bg-rose-900/20 text-rose-200"
    : "border-emerald-700/50 bg-emerald-900/20 text-emerald-200";

  return <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${tone}`}>{text}</p>;
}

export function LoginForm({ next, message }: { next: string; message?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <AuthPageShell title="Log in" subtitle="Use your email and password to access your dashboard.">
      <AuthMessage state={state} message={message} />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
          Password
          <input
            required
            type="password"
            name="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {pending ? "Logging in..." : "Log in"}
          </button>
          <Link
            href="/auth/reset-password"
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        No account yet?{" "}
        <Link
          href={withNext("/signup", next)}
          className="font-semibold text-blue-400 hover:text-blue-300"
        >
          Sign up
        </Link>
      </p>
    </AuthPageShell>
  );
}

export function SignUpForm({ next, message }: { next: string; message?: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <AuthPageShell
      title="Sign up"
      subtitle="Create an account to prepare cloud sync for this dashboard."
    >
      <AuthMessage state={state} message={message} />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
          Password
          <input
            required
            minLength={6}
            type="password"
            name="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href={withNext("/login", next)}
          className="font-semibold text-blue-400 hover:text-blue-300"
        >
          Log in
        </Link>
      </p>
    </AuthPageShell>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <AuthPageShell
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <AuthMessage state={state} />

      {!state.message && (
        <form action={formAction} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-slate-400">
        <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
          Back to log in
        </Link>
      </p>
    </AuthPageShell>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <AuthPageShell title="Set new password" subtitle="Choose a strong password for your account.">
      <AuthMessage state={state} />

      <form action={formAction} className="space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
          New password
          <input
            required
            minLength={6}
            type="password"
            name="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthPageShell>
  );
}
