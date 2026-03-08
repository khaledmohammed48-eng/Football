import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'COACH' | 'PLAYER';
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

  // Use NextAuth credentials endpoint
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE_URL }),
  });

  if (!res.ok) throw new Error('بيانات الدخول غير صحيحة');

  // Get session
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`);
  const session = await sessionRes.json();

  if (!session?.user) throw new Error('فشل تسجيل الدخول');

  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };

  await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
  return user;
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const stored = await SecureStore.getItemAsync('auth_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export async function logout() {
  await SecureStore.deleteItemAsync('auth_user');
  await SecureStore.deleteItemAsync('auth_token');
}
