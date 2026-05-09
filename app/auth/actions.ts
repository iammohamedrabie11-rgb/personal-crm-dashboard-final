"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  message?: string;
}

function getRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;

  const host = headerStore.get("host");
  if (!host) return "";

  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = getRequiredText(formData, "email");
  const password = getPassword(formData);
  const next = getSafeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

export async function signUp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = getRequiredText(formData, "email");
  const password = getPassword(formData);
  const next = getSafeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: origin
      ? {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        }
      : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect(next);
  }

  return { message: "Check your email to confirm your account, then log in." };
}

export async function logout(_formData?: FormData) {
  void _formData;
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = getRequiredText(formData, "email");
  if (!email) return { error: "Enter your email address." };

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin
      ? `${origin}/auth/callback?next=/auth/update-password`
      : undefined,
  });

  if (error) return { error: error.message };

  return { message: "Check your email for a password reset link." };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = getPassword(formData);
  if (!password) return { error: "Enter a new password." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect("/");
}
