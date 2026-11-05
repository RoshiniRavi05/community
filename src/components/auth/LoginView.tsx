'use client';

import React, { useState } from 'react';
import { Stethoscope, ClipboardCheck, Lock, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { AuthUser } from '@/lib/db/types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (usernameToUse?: string, passwordToUse?: string) => {
    setError(null);
    setIsLoading(true);
    const u = usernameToUse || username;
    const p = passwordToUse || password;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', username: u, password: p })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] dark:bg-[#0c1017] text-[#2D3328] dark:text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Subtle background ambient waves matching design system */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 700" preserveAspectRatio="none" fill="none">
          <path d="M-100 200 C200 100, 500 350, 800 220 C950 160, 1100 250, 1200 200 L1200 700 L-100 700 Z" fill="#87936C" fillOpacity="0.08" />
          <path d="M-100 350 C300 250, 600 450, 900 320 L1200 400 L1200 700 L-100 700 Z" fill="#556947" fillOpacity="0.05" />
        </svg>
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#E5EAD7] dark:bg-[#1E271C] border border-[#87936C]/40 text-[#405036] dark:text-[#BAC9A9] text-xs font-semibold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#556947] dark:text-[#87936C]" />
            <span>Role-Based Access Control (RBAC) System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E271C] dark:text-white">
            CommUnity WA — Dwaragasai Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#6C7665] dark:text-stone-400 max-w-xl mx-auto">
            Strict Two-Tier Approval: Medical messages require Doctor approval before the Operations Manager can dispatch via WhatsApp.
          </p>
        </div>

        {/* 1-Click Role Quick Logins (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Doctor */}
          <div className="bg-[#FFFFFF] dark:bg-[#151D28] rounded-2xl p-6 border-2 border-[#87936C]/40 hover:border-[#556947] transition-all shadow-md flex flex-col justify-between relative group">
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E5EAD7] dark:bg-[#1E271C] text-[#34422B] dark:text-[#BAC9A9] border border-[#87936C]/40">
                Approver Role
              </span>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#556947] text-white flex items-center justify-center shadow-sm">
                <Stethoscope className="w-6 h-6 text-[#E5EAD7]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1E271C] dark:text-white flex items-center gap-1.5">
                  Dr. Dwaraga Sai
                </h3>
                <p className="text-xs text-[#556947] dark:text-[#BAC9A9] font-medium">Chief Medical Officer</p>
              </div>

              <div className="text-xs text-[#6C7665] dark:text-stone-300 space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#1E271C] dark:text-white">Username:</span>
                  <code className="bg-[#F0EFE9] dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] text-[#2D3328] dark:text-stone-200">doctor@dwargasai.in</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#1E271C] dark:text-white">Password:</span>
                  <code className="bg-[#F0EFE9] dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] text-[#2D3328] dark:text-stone-200">doctor123</code>
                </div>
              </div>

              <div className="bg-[#FAF9F5] dark:bg-[#101722] p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-[11.5px] text-[#4A5542] dark:text-stone-300 space-y-1">
                <p className="font-medium text-[#1E271C] dark:text-white">Role Authority:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Review medical & community broadcasts</li>
                  <li>Click <span className="font-semibold text-emerald-700 dark:text-emerald-400">Approve</span> to unlock dispatch</li>
                  <li>Preserve patient safety & compliance</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 mt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setUsername('doctor@dwargasai.in');
                  setPassword('doctor123');
                  handleLogin('doctor@dwargasai.in', 'doctor123');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#556947] hover:bg-[#435437] text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Log In as Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Manager */}
          <div className="bg-[#FFFFFF] dark:bg-[#151D28] rounded-2xl p-6 border-2 border-stone-200 dark:border-stone-700 hover:border-[#87936C] transition-all shadow-md flex flex-col justify-between relative group">
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Dispatcher Role
              </span>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#87936C] text-white flex items-center justify-center shadow-sm">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1E271C] dark:text-white flex items-center gap-1.5">
                  Operations Manager
                </h3>
                <p className="text-xs text-[#87936C] dark:text-[#BAC9A9] font-medium">Community Operations</p>
              </div>

              <div className="text-xs text-[#6C7665] dark:text-stone-300 space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#1E271C] dark:text-white">Username:</span>
                  <code className="bg-[#F0EFE9] dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] text-[#2D3328] dark:text-stone-200">manager@dwargasai.in</code>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#1E271C] dark:text-white">Password:</span>
                  <code className="bg-[#F0EFE9] dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] text-[#2D3328] dark:text-stone-200">manager123</code>
                </div>
              </div>

              <div className="bg-[#FAF9F5] dark:bg-[#101722] p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-[11.5px] text-[#4A5542] dark:text-stone-300 space-y-1">
                <p className="font-medium text-[#1E271C] dark:text-white">Role Authority:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Draft and schedule broadcasts</li>
                  <li><span className="font-semibold text-amber-700 dark:text-amber-400">Send Now</span> is LOCKED until Doctor approves</li>
                  <li>Dispatches approved broadcasts to WhatsApp</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 mt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setUsername('manager@dwargasai.in');
                  setPassword('manager123');
                  handleLogin('manager@dwargasai.in', 'manager123');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#87936C] hover:bg-[#74805b] text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Log In as Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Standard Credentials Form Card */}
        <div className="bg-white dark:bg-[#151D28] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm max-w-lg mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6C7665] dark:text-stone-400">
                SIGNIN
              </span>
              <span className="text-[11px] text-[#87936C] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Dwaragasai Auth
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2D3328] dark:text-stone-200 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="doctor@dwargasai.in or manager@dwargasai.in"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0c1017] text-xs text-[#2D3328] dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#556947]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D3328] dark:text-stone-200 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0c1017] text-xs text-[#2D3328] dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#556947]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2D3328] dark:bg-stone-700 hover:bg-[#1E271C] text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate & Open Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
