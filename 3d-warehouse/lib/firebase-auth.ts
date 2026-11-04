'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDUo8yzIcUAxNL8rMuSAaBhZBVhyYvkYm8',
  authDomain: 'hghub-20865.firebaseapp.com',
  projectId: 'hghub-20865',
  storageBucket: 'hghub-20865.firebasestorage.app',
  messagingSenderId: '258182779688',
  appId: '1:258182779688:web:69c2a7c111c0b1ae9df61d',
  measurementId: 'G-HTBWW8C0QD',
};

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const AUTH_COOKIE_NAME = 'hgs_id_token';

let currentTokenMem: string | null = null;
let fetchInterceptorInstalled = false;

/**
 * Installs a window.fetch wrapper so all requests to internal /api/ routes
 * automatically carry the Authorization: Bearer <idToken> header in addition to the cookie.
 */
export function installAuthFetchInterceptor() {
  if (typeof window === 'undefined' || fetchInterceptorInstalled) return;
  fetchInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    const isInternalApi =
      urlStr.includes('/api/') &&
      (urlStr.startsWith('/') || urlStr.includes(window.location.origin));

    if (isInternalApi) {
      const token =
        currentTokenMem ||
        (() => {
          try {
            return localStorage.getItem('HGS_ID_TOKEN');
          } catch {
            return null;
          }
        })();

      if (token) {
        const headers = new Headers(init?.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
      }
    }

    return originalFetch(input, init);
  };
}

/**
 * Sets or clears the session token cookie so all Next.js API routes and
 * image snapshot requests (<img src="/3d-warehouse/api/unifi/snapshot">)
 * are authenticated server-side.
 */
export function setAuthCookie(token: string | null) {
  currentTokenMem = token;
  if (typeof document === 'undefined') return;
  installAuthFetchInterceptor();
  if (token) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=3600; SameSite=Lax${secure}`;
    try {
      localStorage.setItem('HGS_ID_TOKEN', token);
    } catch {}
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    try {
      localStorage.removeItem('HGS_ID_TOKEN');
      localStorage.removeItem('HGS_ACTIVE_USER_ID');
    } catch {}
  }
}

/**
 * Checks whether the authenticated 4HG Hub user has permission to access
 * the 3D Warehouse app ('warehouse-3d') or holds an Admin/Executive role.
 */
export async function checkWarehousePermission(user: User): Promise<{
  allowed: boolean;
  role: string;
  userName: string;
}> {
  const email = (user.email || '').toLowerCase();
  const isCole = email === 'cole@4hgs.com' || email.includes('cole');
  const fallbackName = user.displayName || email.split('@')[0] || 'User';

  if (isCole) {
    return { allowed: true, role: 'Admin', userName: fallbackName };
  }

  // 1. Check Firestore user profile and permissions in parallel
  try {
    const [userSnap, permSnap] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'permissions', user.uid)),
    ]);

    let role = 'Staff';
    let userName = fallbackName;
    if (userSnap.exists()) {
      const uData = userSnap.data();
      role = uData.role || 'Staff';
      userName = uData.name || fallbackName;
    }

    const r = role.toLowerCase();
    const isAdmin =
      r.includes('admin') ||
      r.includes('president') ||
      r.includes('boss') ||
      r.includes('executive') ||
      r.includes('chief');

    if (isAdmin) {
      return { allowed: true, role, userName };
    }

    if (permSnap.exists()) {
      const appIds: string[] = permSnap.data()?.appIds || [];
      if (appIds.includes('warehouse-3d')) {
        return { allowed: true, role, userName };
      }
      return { allowed: false, role, userName };
    }
  } catch {
    // Fallback to cached 4HG Hub localStorage permissions if Firestore check fails
    try {
      const cachedPermsRaw = localStorage.getItem('HGS_PERMISSIONS');
      if (cachedPermsRaw) {
        const cachedPerms = JSON.parse(cachedPermsRaw);
        const userPerms: string[] = cachedPerms?.[user.uid] || [];
        if (userPerms.includes('warehouse-3d')) {
          return { allowed: true, role: 'Authorized', userName: fallbackName };
        }
      }
    } catch {}
  }

  // Default for authenticated 4HG Hub users if no explicit restriction doc exists
  return { allowed: true, role: 'Member', userName: fallbackName };
}

export { signInWithEmailAndPassword, firebaseSignOut, onIdTokenChanged };
export type { User };
