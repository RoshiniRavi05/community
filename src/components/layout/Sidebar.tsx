'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Tent,
  Video,
  BarChart3,
  MessageCircle,
  Settings,
  ShieldAlert,
  BellRing,
  Activity
} from 'lucide-react';

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
  emergencyPauseActive: boolean;
  unresolvedErrorsCount: number;
  scheduledNext7DaysCount: number;
  membersCount?: number;
  onOpenCareAlarms?: () => void;
  activeCareAlarmsCount?: number;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  alert?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  emergencyPauseActive,
  unresolvedErrorsCount,
  scheduledNext7DaysCount,
  membersCount = 19,
  onOpenCareAlarms,
  activeCareAlarmsCount = 0
}) => {
  // Normalize tab for navigation matching
  const currentTab = activeTab === 'overview' ? 'dashboard' : activeTab === 'scheduler' ? 'messages' : activeTab;

  // The 7 required navigation items in exact order from prompt and wireframe
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users, badge: membersCount > 0 ? String(membersCount) : undefined },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: scheduledNext7DaysCount > 0 ? String(scheduledNext7DaysCount) : undefined },
    { id: 'camps', label: 'Camps', icon: Tent },
    { id: 'social', label: 'Social Media', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'whatsapp', label: 'WhatsApp Integration', icon: MessageCircle, alert: unresolvedErrorsCount > 0 }
  ];

  return (
    <aside className="w-60 bg-[#0d121f] border-r border-[#1e293b] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none text-slate-200 z-30">
      <div>
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#16a34a] flex items-center justify-center text-white font-bold shadow-xs">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-xs tracking-wide">
                COMMUNITY HUB
              </div>
              <div className="text-[10px] text-slate-500 font-normal">
                Management Console
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-[#16a34a]/15 text-[#22c55e] border border-[#16a34a]/30">
            PROD
          </span>
        </div>

        {/* Emergency Kill-Switch Notification */}
        {emergencyPauseActive && (
          <div className="mx-3 mt-2.5 p-2 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <div className="font-semibold text-rose-200">Kill-Switch Active</div>
              <div className="text-[10px] text-rose-400 mt-0.5">Outbound dispatch halted</div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="p-2.5 space-y-1 mt-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2.5 py-1">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#16a34a]/15 text-[#22c55e] border border-[#16a34a]/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2c]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#22c55e]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive 
                        ? 'bg-[#16a34a]/30 text-[#86efac]' 
                        : 'bg-[#1e293b] text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Utilities & Status */}
      <div className="p-2.5 border-t border-[#1e293b] space-y-1 bg-[#0a0e18]/60">
        {onOpenCareAlarms && (
          <button
            onClick={onOpenCareAlarms}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-[#151c2c] transition"
          >
            <div className="flex items-center gap-2">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Care Alarms</span>
            </div>
            {activeCareAlarmsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300">
                {activeCareAlarmsCount} ON
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] transition ${
            activeTab === 'settings'
              ? 'bg-[#16a34a]/15 text-[#22c55e]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2c]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings & Anti-Spam</span>
        </button>

        <div className="pt-2 px-2.5 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>WhatsApp Cloud API</span>
          </div>
          <span className="font-mono text-slate-500">v2.4</span>
        </div>
      </div>
    </aside>
  );
};
