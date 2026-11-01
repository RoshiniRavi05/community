'use client';

import React from 'react';
import {
  Play,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Plus,
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

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Weekly messaging performance, member fluctuations, and scheduled dispatches'
  },
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Weekly messaging performance, member fluctuations, and scheduled dispatches'
  },
  members: {
    title: 'Community Members',
    subtitle: 'Directory, verification statuses, camp affiliations, and consent logs'
  },
  messages: {
    title: 'Messages & Broadcasts',
    subtitle: 'Campaign management, weekly calendar, and automated dispatches'
  },
  scheduler: {
    title: 'Messages & Broadcasts',
    subtitle: 'Campaign management, weekly calendar, and automated dispatches'
  },
  camps: {
    title: 'Scheduled Camps & Events',
    subtitle: 'Field camps, venue logistics, RSVPs, and WhatsApp notifications'
  },
  social: {
    title: 'Social Media Distribution',
    subtitle: 'Curated Reels and Shorts with WhatsApp community sharing'
  },
  analytics: {
    title: 'Analytics & Delivery Metrics',
    subtitle: 'Official WhatsApp API delivery reports, read rates, and member trends'
  },
  whatsapp: {
    title: 'WhatsApp Integration & API',
    subtitle: 'Meta Cloud API connection, community groups, and webhook diagnostics'
  },
  settings: {
    title: 'Anti-Spam & Automation Controls',
    subtitle: 'Frequency caps, quiet hours, audit logs, and delivery safeguards'
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
  activeAlarmsCount = 0
}) => {
  const current = TAB_TITLES[activeTab] || { title: 'Community Hub', subtitle: 'Operations Console' };

  return (
    <header className="h-14 border-b border-[#1e293b] bg-[#0d121f]/95 backdrop-blur-xs px-5 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
          {current.title}
        </h1>
        <p className="text-[11px] text-slate-400 hidden sm:block">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Run Dispatcher / Scheduler Sweep */}
        <button
          onClick={onTriggerScheduler}
          disabled={isSyncing}
          title="Scan scheduled messages and trigger pending broadcasts"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#162032] hover:bg-[#1e2c45] border border-[#273549] text-slate-200 text-xs font-medium transition disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 text-[#22c55e] ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Run Dispatcher</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          title="Refresh community records"
          className="p-1.5 rounded-md bg-[#162032] hover:bg-[#1e2c45] border border-[#273549] text-slate-300 transition disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#22c55e]' : ''}`} />
        </button>

        {/* Emergency Pause Toggle */}
        <button
          onClick={onToggleEmergencyPause}
          title={emergencyPauseActive ? "Deactivate kill-switch and resume outbound messaging" : "Activate emergency kill-switch to immediately halt all dispatches"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition border ${
            emergencyPauseActive
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-[#162032] text-slate-300 border-[#273549] hover:bg-rose-950/20 hover:text-rose-300 hover:border-rose-800/40'
          }`}
        >
          {emergencyPauseActive ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Kill-Switch ON</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">Kill-Switch: Normal</span>
            </>
          )}
        </button>

        {/* Quick Add Message */}
        <button
          onClick={onOpenScheduleModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Message</span>
        </button>
      </div>
    </header>
  );
};
