'use client';

import React, { useEffect, useState } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  firebaseSignOut,
  onIdTokenChanged,
  setAuthCookie,
  checkWarehousePermission,
  User,
} from '@/lib/firebase-auth';
import { Lock, LogIn, ShieldAlert, ArrowLeft, Loader2, LogOut, Box } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'unauthorized' | 'authenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<{ role: string; userName: string }>({
    role: '',
    userName: '',
  });

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setAuthCookie(null);
        setCurrentUser(null);
        setAuthState('unauthenticated');
        return;
      }

      try {
        const token = await user.getIdToken();
        setAuthCookie(token);
        try {
          localStorage.setItem('HGS_ACTIVE_USER_ID', user.uid);
        } catch {}

        setCurrentUser(user);
        const perm = await checkWarehousePermission(user);
        setUserMeta({ role: perm.role, userName: perm.userName });

        if (perm.allowed) {
          setAuthState('authenticated');
        } else {
          setAuthState('unauthorized');
        }
      } catch {
        setAuthCookie(null);
        setAuthState('unauthenticated');
      }
    });

    // Periodically refresh the ID token cookie every 45 minutes while active
    const refreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          const freshToken = await auth.currentUser.getIdToken(true);
          setAuthCookie(freshToken);
        } catch {}
      }
    }, 45 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Invalid 4HG Hub email or password.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setAuthCookie(null);
    await firebaseSignOut(auth);
  };

  // 1. Initial Auth Verification Loader
  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none z-50">
        <div className="w-14 h-14 rounded-2xl bg-[#8DDB05]/15 border border-[#8DDB05]/40 flex items-center justify-center text-[#8DDB05] shadow-lg shadow-[#8DDB05]/10 mb-4">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <div className="text-sm font-bold tracking-wide text-slate-200">
          Verifying 4HG Hub Session...
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Authenticating security credentials
        </div>
      </div>
    );
  }

  // 2. Unauthenticated — 4HG Hub Login Gate
  if (authState === 'unauthenticated') {
    return (
      <div className="fixed inset-0 bg-slate-950 text-slate-100 flex items-center justify-center p-4 z-50 overflow-y-auto">
        {/* Subtle radial glow background */}
        <div
          className="fixed inset-0 pointer-events-none opacity-25"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(141, 219, 5, 0.22), transparent 60%)',
          }}
        />

        <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl p-7 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8DDB05]/15 border border-[#8DDB05]/40 flex items-center justify-center text-[#8DDB05] shadow-inner">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#8DDB05]">
                  4HG HUB SECURITY GATE
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  3D Warehouse Digital Twin
                </h1>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Access to the 4HG Shop 3D Warehouse, Odoo ERP locations, and UniFi Protect feeds requires an active{' '}
            <span className="text-slate-200 font-semibold">4HG Hub</span> account.
          </p>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4HG Hub Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@4hgs.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#8DDB05] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#8DDB05] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8DDB05] hover:bg-[#9be915] text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#8DDB05]/15"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with 4HG Hub</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Return Link */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <a
              href="https://4hghub.com"
              className="text-slate-400 hover:text-[#8DDB05] transition flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to 4HG Hub</span>
            </a>
            <span className="text-[10px] font-mono text-slate-500">
              Firebase Auth • SSO
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthorized — Logged in, but missing 'warehouse-3d' permission
  if (authState === 'unauthorized') {
    return (
      <div className="fixed inset-0 bg-slate-950 text-slate-100 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-7 space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Signed in as <span className="text-slate-200 font-mono">{currentUser?.email}</span> ({userMeta.role}),
              but your 4HG Hub profile does not currently have permission assigned for{' '}
              <span className="text-slate-200 font-semibold">3D Warehouse</span>.
            </p>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <a
              href="https://4hghub.com"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to 4HG Hub</span>
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Authorized
  return <>{children}</>;
}
