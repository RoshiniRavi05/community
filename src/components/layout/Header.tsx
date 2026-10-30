'use client';

import React from 'react';
import { 
  Play, 
  RotateCw, 
  ShieldAlert, 
  ShieldCheck, 
  Plus,
  Search,
  Bell,
  BellRing
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  emergencyPauseActive: boolean;
  onToggleEmergencyPause: () => void;
  onTriggerScheduler: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  onOpenScheduleModal: () => void;
  onOpenCareAlarmsModal?: () => void;
  activeAlarmsCount?: number;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard',
    subtitle: 'Welcome back, Sophia'
  },
  members: {
    title: 'Members Directory',
    subtitle: 'Community records, opt-in consent, and demographics'
  },
  scheduler: {
    title: 'Messages & Campaigns',
    subtitle: 'Queue, dispatch schedule, and broadcast templates'
  },
  calendar: {
    title: 'Weekly Planning Calendar',
    subtitle: 'Broadcast distribution and frequency caps across channels'
  },
  logs: {
    title: 'Automation Logs',
    subtitle: 'Delivery audits, rate limiting, and failure diagnostics'
  },
  social: {
    title: 'Social Media',
    subtitle: 'Curated video shorts, reels, and community links'
  },
  camps: {
    title: 'Camps & Workshops',
    subtitle: 'Venue capacities, ticket tiers, and RSVP attendance'
  },
  discounts: {
    title: 'Discounts & Offers',
    subtitle: 'Promotional codes, exclusivity parameters, and claims'
  },
  monitor: {
    title: 'Automation Monitor',
    subtitle: 'System health, queue status, and rate limit diagnostics'
  },
  whatsapp: {
    title: 'WhatsApp Integration',
    subtitle: 'Meta Cloud API credentials and live webhook console'
  },
  settings: {
    title: 'Anti-Spam Settings',
    subtitle: 'Frequency limits, quiet hours, and compliance audit trail'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  emergencyPauseActive,
  onToggleEmergencyPause,
  onTriggerScheduler,
  onRefresh,
  isSyncing,
  onOpenScheduleModal,
  onOpenCareAlarmsModal,
  activeAlarmsCount
}) => {
  const current = TAB_TITLES[activeTab] || { title: 'Dashboard', subtitle: 'Overview' };

  return (
    <header className="h-16 border-b border-[#1a2436] bg-[#0c121e]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Search */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">
            {current.title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {current.subtitle}
          </p>
        </div>

        {/* Search Bar matching image */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 lg:w-64 bg-[#141c2c] border border-[#1e2a3c] rounded-xl pl-8 pr-10 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]/60 transition-colors"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-[#1c2738] px-1.5 py-0.5 rounded border border-[#27354a]">
            ⌘K
          </span>
        </div>
      </div>

      {/* Header Controls & Profile Pill */}
      <div className="flex items-center gap-3">
        {/* Care & Medicine Alarm Clock Button */}
        {onOpenCareAlarmsModal && (
          <button
            onClick={onOpenCareAlarmsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-xs font-semibold text-slate-200 transition shadow-xs"
            title="Clock Alarms: Reminders to eat or take medicine for elderly customers"
          >
            <BellRing className="w-3.5 h-3.5 text-[#c2f83a]" />
            <span className="hidden sm:inline">Care Alarms</span>
            {activeAlarmsCount !== undefined && activeAlarmsCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#c2f83a] text-black font-extrabold">
                {activeAlarmsCount}
              </span>
            )}
          </button>
        )}

        {/* Scheduler Trigger */}
        <button
          onClick={onTriggerScheduler}
          disabled={isSyncing}
          title="Run background scheduler now to process due messages"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-200 text-xs font-medium transition shadow-xs disabled:opacity-50"
        >
          <Play className="w-3 h-3 text-[#c2f83a] fill-[#c2f83a]" />
          <span>Sweep queue</span>
        </button>

        {/* Sync / Refresh */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          title="Refresh data"
          className="p-2 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-300 hover:text-white transition disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#c2f83a]' : ''}`} />
        </button>

        {/* Kill Switch Toggle */}
        <button
          onClick={onToggleEmergencyPause}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border shadow-xs ${
            emergencyPauseActive
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-[#141c2c] hover:bg-[#1a253a] border-[#1e2a3c] text-slate-300'
          }`}
          title="Emergency pause halts all outgoing scheduled campaigns immediately"
        >
          {emergencyPauseActive ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300">Queue paused</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#c2f83a]" />
              <span className="hidden lg:inline text-slate-300">Kill-switch active</span>
            </>
          )}
        </button>

        {/* Dark/Light Switch Toggle */}
        <div 
          className="w-11 h-6 bg-[#162032] border border-[#223046] rounded-full p-0.5 flex items-center justify-end cursor-pointer shadow-inner"
          title="Theme: Dark Mode Active"
        >
          <div className="w-4.5 h-4.5 rounded-full bg-[#c2f83a] shadow-[0_0_10px_rgba(194,248,58,0.7)]"></div>
        </div>

        {/* Notification Bell with indicator */}
        <div className="relative p-2 rounded-xl bg-[#141c2c] border border-[#1e2a3c] text-slate-300 cursor-pointer hover:text-white transition">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c2f83a] shadow-[0_0_6px_rgba(194,248,58,0.8)]"></span>
        </div>

        {/* User Pill Badge matching reference image */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141c2c] border border-[#1e2a3c] rounded-xl">
          <div className="w-6 h-6 rounded-full bg-[#c2f83a] text-black font-extrabold text-[10px] flex items-center justify-center">
            SA
          </div>
          <span className="text-xs font-semibold text-slate-100 hidden sm:inline">Sophia</span>
        </div>

        {/* New Message / Campaign Button in Lime */}
        <button
          onClick={onOpenScheduleModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black font-bold text-xs transition shadow-[0_0_15px_rgba(194,248,58,0.3)] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden md:inline">New message</span>
        </button>
      </div>
    </header>
  );
};
