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
  HelpCircle,
  ChevronDown,
  ShieldAlert
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
  emergencyPauseActive?: boolean;
  unresolvedErrorsCount?: number;
  scheduledNext7DaysCount?: number;
  membersCount?: number;
  onOpenCareAlarms?: () => void;
  activeCareAlarmsCount?: number;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  emergencyPauseActive = false,
}) => {
  // Normalize tab for navigation matching
  const currentTab =
    activeTab === 'overview'
      ? 'dashboard'
      : activeTab === 'scheduler' || activeTab === 'calendar'
      ? 'messages'
      : activeTab;

  // Exact 7 items in order from requirements:
  // 1. Dashboard, 2. Members, 3. Messages, 4. Camps, 5. Social Media, 6. Analytics, 7. WhatsApp Integration
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'camps', label: 'Camps', icon: Tent },
    { id: 'social', label: 'Social Media', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'whatsapp', label: 'WhatsApp Integration', icon: MessageCircle }
  ];

  return (
    <aside className="w-[230px] bg-[#263323] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 font-sans">
      <div className="flex flex-col">
        {/* Brand Header with Distinct Two-Tone Leaf Brand Mark */}
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
                stroke="#263323"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-bold text-[16px] tracking-tight text-[#FFFFFF]">
            Community Hub
          </span>
        </div>

        {/* Emergency Kill-Switch notification if active */}
        {emergencyPauseActive && (
          <div className="mx-4 mb-2 p-2 rounded bg-[#C65B42]/20 border border-[#C65B42]/40 text-[#F4F0E8] text-[11px] flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C65B42] shrink-0" />
            <span className="truncate">Kill-Switch Active</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#87936C]/30 text-white font-semibold'
                    : 'text-[#D9D6CC]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  strokeWidth={1.8}
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-[#87936C]' : 'text-[#D9D6CC]/70'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Subtle leaf watermark detail, Help & Support, User profile */}
      <div className="p-4 space-y-3 relative overflow-hidden">
        {/* Subtle leaf contour watermark in background */}
        <svg
          className="absolute -right-4 -bottom-6 w-28 h-28 text-white/[0.03] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
        </svg>

        {/* Help & Support */}
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#D9D6CC]/80 hover:text-white transition-colors text-left"
        >
          <HelpCircle strokeWidth={1.8} className="w-[18px] h-[18px] text-[#D9D6CC]/70" />
          <span>Help & Support</span>
        </button>

        {/* User Profile */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#87936C]/30 text-[#87936C] flex items-center justify-center font-semibold text-xs shrink-0">
              RR
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-white truncate leading-tight">
                Roshini Ravi
              </div>
              <div className="text-[11px] text-[#85877F] leading-tight mt-0.5">
                Admin
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#85877F] shrink-0" />
        </div>
      </div>
    </aside>
  );
};
