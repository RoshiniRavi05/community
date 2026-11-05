'use client';

import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Tent,
  Video,
  BarChart3,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ShieldAlert,
  Stethoscope,
  ClipboardCheck,
  ArrowLeftRight,
  LogOut,
  UserCheck
} from 'lucide-react';
import { AuthUser } from '@/lib/db/types';

export type ActiveTab =
  | 'dashboard'
  | 'overview'
  | 'members'
  | 'messages'
  | 'scheduler'
  | 'calendar'
  | 'camps'
  | 'social'
  | 'analytics'
  | 'monitor'
  | 'whatsapp'
  | 'logs'
  | 'discounts'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  emergencyPauseActive?: boolean;
  unresolvedErrorsCount?: number;
  scheduledNext7DaysCount?: number;
  membersCount?: number;
  onOpenCareAlarms?: () => void;
  activeCareAlarmsCount?: number;
  currentUser?: AuthUser | null;
  onSwitchRole?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  emergencyPauseActive = false,
  currentUser,
  onSwitchRole,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Normalize tab for navigation matching
  const currentTab =
    activeTab === 'overview'
      ? 'dashboard'
      : activeTab === 'scheduler' || activeTab === 'calendar'
      ? 'messages'
      : activeTab;

  const isDoctor = currentUser?.role === 'doctor';

  return (
    <aside className="w-[230px] bg-[#1E271C] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 font-sans relative overflow-hidden">
      {/* ── REALISTIC DUAL-CURVE S-WAVES (Replicating exact curves from reference) ── */}
      <div className="absolute inset-x-0 bottom-14 top-40 pointer-events-none z-0 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 230 420"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle upper background wave */}
          <path
            d="M-30 250 C40 180, 110 260, 170 210 C200 185, 230 190, 260 205 L260 440 L-30 440 Z"
            fill="url(#waveLightLayer)"
          />
          {/* Wave line 1 */}
          <path
            d="M-30 250 C40 180, 110 260, 170 210 C200 185, 230 190, 260 205"
            stroke="#87936C"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Lower foreground distinct swell */}
          <path
            d="M-20 330 C50 250, 120 340, 180 280 C210 250, 235 255, 260 270 L260 440 L-20 440 Z"
            fill="url(#waveDeepLayer)"
          />
          {/* Wave line 2 */}
          <path
            d="M-20 330 C50 250, 120 340, 180 280 C210 250, 235 255, 260 270"
            stroke="#9CB080"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Low organic tail */}
          <path
            d="M-10 390 C60 350, 140 375, 240 320"
            stroke="#87936C"
            strokeWidth="0.8"
            strokeOpacity="0.3"
          />

          <defs>
            <linearGradient id="waveLightLayer" x1="115" y1="180" x2="115" y2="440" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2D3B2A" stopOpacity="0.75" />
              <stop offset="1" stopColor="#1B2418" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="waveDeepLayer" x1="115" y1="240" x2="115" y2="440" gradientUnits="userSpaceOnUse">
              <stop stopColor="#384934" stopOpacity="0.85" />
              <stop offset="1" stopColor="#172015" stopOpacity="0.95" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Navigation Stack */}
      <div className="flex flex-col relative z-10">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <svg
              className="w-7 h-7"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left leaf lobe (sage green) */}
              <path
                d="M4 24C4 24 6 12 16 6C16 6 16 16 7 23L4 24Z"
                fill="#87936C"
              />
              {/* Right leaf lobe (light vibrant green) */}
              <path
                d="M16 6C16 6 24 10 24 18C24 23 18 24 13 24C10.5 24 7 23 7 23C16 16 16 6 16 6Z"
                fill="#A8B78C"
              />
              {/* Leaf central stem vein */}
              <path
                d="M4 24C8 21 13 14 16 6"
                stroke="#1E271C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <span className="font-bold text-[17px] tracking-tight text-[#FFFFFF] block leading-tight">
              Dwaragasai
            </span>
            <span className="text-[10px] text-[#A0A89A] block leading-tight">
              Community Management
            </span>
          </div>
        </div>

        {/* Emergency Kill-Switch notification if active */}
        {emergencyPauseActive && (
          <div className="mx-4 mb-2 p-2 rounded bg-[#C65B42]/20 border border-[#C65B42]/40 text-[#F4F0E8] text-[11px] flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C65B42] shrink-0" />
            <span className="truncate">Kill-Switch Active</span>
          </div>
        )}

        {/* Navigation Items (Exact outline icons & pill styling matching reference) */}
        <nav className="px-3 space-y-1.5 mt-2">
          {/* 1. Dashboard (Special pill capsule with outline house icon matching reference) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all text-left ${
              currentTab === 'dashboard'
                ? 'bg-[#556947] text-white font-semibold shadow-md'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg
              className="w-5 h-5 shrink-0 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="truncate">Dashboard</span>
          </button>

          {/* 2. Members */}
          <button
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left ${
              currentTab === 'members'
                ? 'bg-[#556947] text-white font-semibold'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users strokeWidth={1.75} className="w-[19px] h-[19px] shrink-0 text-[#D9D6CC]/85" />
            <span className="truncate">Members</span>
          </button>

          {/* 3. Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left ${
              currentTab === 'messages'
                ? 'bg-[#556947] text-white font-semibold'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            {/* Outline chat bubble with grid dots like reference */}
            <svg
              className="w-[19px] h-[19px] shrink-0 stroke-current text-[#D9D6CC]/85"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="8" cy="10" r="0.75" fill="currentColor" stroke="none" />
              <circle cx="12" cy="10" r="0.75" fill="currentColor" stroke="none" />
              <circle cx="16" cy="10" r="0.75" fill="currentColor" stroke="none" />
            </svg>
            <span className="truncate">Messages</span>
          </button>

          {/* 4. Camps */}
          <button
            onClick={() => setActiveTab('camps')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left ${
              currentTab === 'camps'
                ? 'bg-[#556947] text-white font-semibold'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tent strokeWidth={1.75} className="w-[19px] h-[19px] shrink-0 text-[#D9D6CC]/85" />
            <span className="truncate">Camps</span>
          </button>

          {/* 5. Social Media */}
          <button
            onClick={() => setActiveTab('social')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left ${
              currentTab === 'social'
                ? 'bg-[#556947] text-white font-semibold'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Video strokeWidth={1.75} className="w-[19px] h-[19px] shrink-0 text-[#D9D6CC]/85" />
            <span className="truncate">Social Media</span>
          </button>

          {/* 6. Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left ${
              currentTab === 'analytics'
                ? 'bg-[#556947] text-white font-semibold'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 strokeWidth={1.75} className="w-[19px] h-[19px] shrink-0 text-[#D9D6CC]/85" />
            <span className="truncate">Analytics</span>
          </button>

          {/* 7. WhatsApp Integration */}
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left ${
              currentTab === 'whatsapp'
                ? 'bg-[#556947] text-white font-semibold'
                : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle strokeWidth={1.75} className="w-[19px] h-[19px] shrink-0 text-[#D9D6CC]/85" />
            <span className="truncate">WhatsApp Integration</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Help & Support, User profile */}
      <div className="p-4 space-y-3 relative z-10">
        {/* Help & Support */}
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#D9D6CC]/85 hover:text-white transition-colors text-left"
        >
          <HelpCircle strokeWidth={1.75} className="w-[19px] h-[19px] text-[#D9D6CC]/80" />
          <span>Help & Support</span>
        </button>

        {/* User Profile Area (Role-based) */}
        <div className="relative">
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-[#273523] border border-white/20 shadow-xl space-y-1 z-30 text-xs">
              <div className="px-2 py-1 text-[11px] text-[#A0A89A] border-b border-white/10">
                Logged in as: <strong className="text-white">{currentUser?.username}</strong>
              </div>
              {onSwitchRole && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSwitchRole();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-white flex items-center gap-2 transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#A8B78C]" />
                  <span>Switch to {isDoctor ? 'Manager' : 'Doctor'}</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/40 text-rose-300 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}

          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="pt-3 border-t border-white/10 flex items-center justify-between px-2 cursor-pointer hover:bg-white/5 rounded-lg py-1.5 transition"
            title="Click to switch role or sign out"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs ${
                  isDoctor ? 'bg-[#27833A]' : 'bg-[#87936C]'
                }`}
              >
                {currentUser?.avatar || (isDoctor ? 'DS' : 'OM')}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-white truncate leading-tight">
                  {currentUser?.name || (isDoctor ? 'Dr. Dwaraga Sai' : 'Operations Manager')}
                </div>
                <div className="text-[10px] text-[#A0A89A] leading-tight mt-0.5 truncate flex items-center gap-1">
                  {isDoctor ? (
                    <span className="text-emerald-400 font-semibold">Doctor (Approver)</span>
                  ) : (
                    <span className="text-amber-300 font-semibold">Manager (Dispatcher)</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A0A89A] shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
};
