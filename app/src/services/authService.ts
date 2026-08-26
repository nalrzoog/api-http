import { supabase } from '../lib/supabase';

export const MAX_USERS = 10;
export const MAX_USERS_MESSAGE = 'تم الوصول إلى الحد الأقصى لعدد المستخدمين.';

/** Arabic, user-facing translation of the Supabase/PostgREST errors we expect to hit. */
export function toArabicAuthError(error: unknown, fallback = 'حدث خطأ غير متوقع، حاول مرة أخرى'): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const message = raw.toLowerCase();

  if (message.includes('الحد الأقصى') || raw.includes(MAX_USERS_MESSAGE)) {
    return MAX_USERS_MESSAGE;
  }
  if (message.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }
  if (message.includes('user already registered') || message.includes('already registered') || message.includes('already exists')) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً';
  }
  if (message.includes('password should be at least') || message.includes('password') && message.includes('character')) {
    return 'كلمة المرور يجب ألا تقل عن 6 أحرف';
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'صيغة البريد الإلكتروني غير صحيحة';
  }
  if (message.includes('email not confirmed')) {
    return 'يرجى تأكيد البريد الإلكتروني أولاً';
  }
  if (message.includes('email rate limit') || message.includes('rate limit')) {
    return 'محاولات كثيرة جداً، حاول لاحقاً';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت';
  }
  if (message.includes('database error saving new user')) {
    // The trigger-level 10-user cap raises inside the same transaction as
    // the auth.users insert; GoTrue sometimes surfaces it generically.
    return MAX_USERS_MESSAGE;
  }
  return fallback;
}

/** Pre-check the frontend calls before attempting signup, for a clean UX
 * message instead of a raw auth error in the common (non-race) case. The
 * database trigger remains the real, race-safe source of truth. */
export async function isSignupAllowed(): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_registered_user_count');
  if (error) {
    // If the check itself fails, don't block signup on it — the DB trigger
    // still enforces the cap as the source of truth.
    return true;
  }
  return (data ?? 0) < MAX_USERS;
}

export async function registerUser(fullName: string, email: string, password: string) {
  const allowed = await isSignupAllowed();
  if (!allowed) {
    throw new Error(MAX_USERS_MESSAGE);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;
  return data;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
