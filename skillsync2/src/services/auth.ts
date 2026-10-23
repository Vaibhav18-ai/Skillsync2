import { User } from '../types';
import { store } from './storage';

const SESSION_KEY = 'skillsync_auth_user';

export function getSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      // Ensure user still exists in store
      const verified = store.getUserById(u.id);
      return verified || null;
    }
  } catch {
    // fallback
  }
  return null;
}

export function setSessionUser(user: User | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function login(email: string, password?: string): User {
  const user = store.getUserByEmail(email);
  if (!user) {
    throw new Error('Email not found. Use student1@skillsync.test or coordinator@skillsync.test');
  }
  // In demo mode, accept any non-empty password or Demo@1234
  if (password && password.length < 4) {
    throw new Error('Password must be at least 4 characters.');
  }
  setSessionUser(user);
  return user;
}

export function register(name: string, email: string): User {
  const user = store.registerStudent(name, email);
  setSessionUser(user);
  return user;
}

export function logout() {
  setSessionUser(null);
}
