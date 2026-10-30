'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Video, 
  Tent, 
  Tag, 
  FileText, 
  Settings,
  ShieldAlert,
  Radio,
  Activity,
  ChevronRight,
  Send,
  BellRing
} from 'lucide-react';

export type ActiveTab = 
  | 'overview'
  | 'members'
  | 'scheduler'
  | 'calendar'
  | 'social'
  | 'camps'
  | 'discounts'
  | 'logs'
  | 'monitor'
  | 'whatsapp'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  emergencyPauseActive: boolean;
  unresolvedErrorsCount: number;
  scheduledNext7DaysCount: number;
  onOpenCareAlarms?: () => void;
  activeCareAlarmsCount?: number;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: any;
  badge?: string;
  alert?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  emergencyPauseActive,
  unresolvedErrorsCount,
  scheduledNext7DaysCount,
  onOpenCareAlarms,
  activeCareAlarmsCount
}) => {
  const sections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'overview' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'monitor' as ActiveTab, label: 'Analytics & Health', icon: Activity },
      ]
    },
    {
      title: 'COMMUNITY',
      items: [
        { id: 'members' as ActiveTab, label: 'Members', icon: Users, badge: '12' },
        { 
          id: 'scheduler' as ActiveTab, 
          label: 'Messages', 
          icon: MessageSquare,
          badge: scheduledNext7DaysCount > 0 ? `${scheduledNext7DaysCount}` : undefined 
        },
        { id: 'calendar' as ActiveTab, label: 'Calendar', icon: CalendarIcon },
      ]
    },
    {
      title: 'CAMPAIGNS',
      items: [
        { id: 'camps' as ActiveTab, label: 'Camps & Events', icon: Tent },
        { id: 'discounts' as ActiveTab, label: 'Discounts & Offers', icon: Tag },
        { id: 'social' as ActiveTab, label: 'Social Media', icon: Video },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { 
          id: 'logs' as ActiveTab, 
          label: 'Message Logs', 
          icon: FileText,
          alert: unresolvedErrorsCount > 0
        },
        { id: 'whatsapp' as ActiveTab, label: 'WhatsApp API', icon: Send },
        { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0a0e18] border-r border-[#172132] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none text-slate-200">
      <div className="overflow-y-auto">
        {/* Brand Header matching image */}
        <div className="h-16 px-5 border-b border-[#172132] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#c2f83a] flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(194,248,58,0.4)]">
              <Radio className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                CommUnity <span className="text-[10px] px-1.5 py-0.5 bg-[#c2f83a]/20 text-[#c2f83a] rounded font-mono font-bold">WA</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Community Operations</div>
            </div>
          </div>
        </div>

        {/* Emergency Pause Warning Banner */}
        {emergencyPauseActive && (
          <div className="mx-3.5 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-tight">
              <div className="font-bold text-rose-200 text-xs">Kill-Switch Active</div>
              <div className="text-[10px] text-rose-400 mt-0.5">Automated queue dispatch paused</div>
            </div>
          </div>
        )}

        {/* Grouped Navigation List matching reference image */}
        <div className="p-3 space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-[#c2f83a]/15 text-[#c2f83a] font-semibold border border-[#c2f83a]/30 shadow-[0_0_15px_rgba(194,248,58,0.15)]'
                        : 'text-slate-400 hover:text-white hover:bg-[#121a28] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c2f83a]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c2f83a] text-black font-extrabold shadow-[0_0_8px_rgba(194,248,58,0.5)] font-mono">
                          {item.badge}
                        </span>
                      )}
                      {item.alert && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Care & Medicine Alarm Clock Card */}
        {onOpenCareAlarms && (
          <div className="mx-3 my-2 p-3 rounded-2xl bg-[#121927] border border-[#1d273a] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <BellRing className="w-3.5 h-3.5 text-[#c2f83a]" />
                Care Alarms
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#c2f83a]/20 text-[#c2f83a] font-bold">
                {activeCareAlarmsCount ?? 3} ON
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Medicine & meal alarms notified to elderly customers daily until switched OFF.
            </p>
            <button
              onClick={onOpenCareAlarms}
              className="w-full py-1.5 rounded-xl bg-[#182335] hover:bg-[#202e45] text-[11px] font-semibold text-slate-200 transition text-center"
            >
              Open Alarm Clock
            </button>
          </div>
        )}
      </div>

      {/* Profile Card Footer matching reference image */}
      <div className="p-3 border-t border-[#172132]">
        <div className="p-2.5 rounded-xl bg-[#101726] border border-[#1a2538] flex items-center justify-between hover:border-[#25354e] transition cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#c2f83a] text-black font-extrabold text-xs flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(194,248,58,0.4)]">
              SA
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Sophia Anderson</div>
              <div className="text-[10px] text-slate-400 truncate">Administrator</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
};
