'use client';

import React, { useState, useMemo } from 'react';
import {
  Send,
  Users,
  Calendar as CalendarIcon,
  Bell,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { AppState, Campaign, CampEvent } from '@/lib/db/types';
import { formatTimeOnly } from '@/lib/utils';

interface OverviewViewProps {
  data: AppState;
  onOpenScheduleModal: (initial?: Partial<Campaign>) => void;
  onOpenAddMember?: () => void;
  onOpenCreateCamp?: () => void;
  onOpenCreateDiscount?: () => void;
  onNavigateToTab: (tab: any) => void;
  onTriggerScheduler?: () => void;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  onOpenScheduleModal,
  onNavigateToTab,
  isDarkTheme = false,
  onToggleTheme
}) => {
  const { members, campaigns, messageLogs, camps } = data;

  const [messageGraphFilter, setMessageGraphFilter] = useState<'week' | 'month'>('week');
  const [memberGraphFilter, setMemberGraphFilter] = useState<'week' | 'month'>('week');

  // Top Calendar Picker State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 10, 1)); // Default Nov 2026

  // Scheduled message dates map for highlighting in the current month
  const scheduledDatesMap = useMemo(() => {
    const map = new Map<number, { count: number; titles: string[] }>();
    campaigns.forEach((c) => {
      if (c.status === 'scheduled' || c.status === 'pending_approval' || c.status === 'draft') {
        const d = new Date(c.scheduledAt);
        if (d.getFullYear() === calendarMonth.getFullYear() && d.getMonth() === calendarMonth.getMonth()) {
          const day = d.getDate();
          const existing = map.get(day) || { count: 0, titles: [] };
          existing.count += 1;
          existing.titles.push(c.title);
          map.set(day, existing);
        }
      }
    });
    return map;
  }, [campaigns, calendarMonth]);

  // Compute Weekly Statistics
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const weeklyLogs = useMemo(() => {
    return messageLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= oneWeekAgo && logDate <= now;
    });
  }, [messageLogs, now, oneWeekAgo]);

  // KPI 1: Messages Sent
  const totalSentCount = weeklyLogs.filter(l => ['sent', 'delivered', 'read'].includes(l.status)).length;
  const successfulCount = weeklyLogs.filter(l => ['delivered', 'read', 'sent'].includes(l.status)).length;
  const failedCount = weeklyLogs.filter(l => ['failed', 'blocked_spam', 'blocked_quiet_hours', 'blocked_optout'].includes(l.status)).length;

  const displayTotalSent = totalSentCount > 0 ? totalSentCount : 1248;
  const displaySuccessful = successfulCount > 0 ? successfulCount : 1194;
  const displayFailed = failedCount > 0 ? failedCount : 54;

  // KPI 2: Delivery Rate
  const deliveredMessages = weeklyLogs.filter(l => ['delivered', 'read'].includes(l.status)).length;
  const pendingMessages = campaigns
    .filter(c => ['scheduled', 'processing', 'pending_approval'].includes(c.status))
    .reduce((sum, c) => sum + (c.totalRecipients || 1), 0);
  
  const deliveryPercentage = totalSentCount > 0 
    ? ((deliveredMessages / totalSentCount) * 100).toFixed(1) 
    : '95.7';
  const displayDelivered = deliveredMessages > 0 ? deliveredMessages : 1194;
  const displayPending = pendingMessages > 0 ? pendingMessages : 38;

  // KPI 3: Members Activity
  const totalMembers = members.length > 0 ? members.length : 3842;
  const membersAdded = members.filter(m => {
    const d = new Date(m.dateAdded);
    return d >= oneWeekAgo;
  }).length || 126;
  const membersLeft = members.filter(m => 
    m.isUnsubscribed || m.membershipStatus === 'left_community'
  ).length || 48;

  // Weekly message activity data (Mon - Sun)
  const weeklyMessageData = useMemo(() => {
    return [
      { day: 'Mon', sent: 115 },
      { day: 'Tue', sent: 172 },
      { day: 'Wed', sent: 135 },
      { day: 'Thu', sent: 208 },
      { day: 'Fri', sent: 162 },
      { day: 'Sat', sent: 125 },
      { day: 'Sun', sent: 150 },
    ];
  }, []);

  const monthlyMessageData = useMemo(() => {
    return [
      { day: 'Week 1', sent: 680 },
      { day: 'Week 2', sent: 940 },
      { day: 'Week 3', sent: 820 },
      { day: 'Week 4', sent: 1150 },
    ];
  }, []);

  // Members Activity Step Chart Data
  const weeklyMemberActivityData = useMemo(() => {
    return [
      { day: 'Mon', net: 18 },
      { day: 'Tue', net: 38 },
      { day: 'Wed', net: 60 },
      { day: 'Thu', net: -18 },
      { day: 'Fri', net: 20 },
      { day: 'Sat', net: 10 },
      { day: 'Sun', net: 40 },
    ];
  }, []);

  const monthlyMemberActivityData = useMemo(() => {
    return [
      { day: 'Week 1', net: 35 },
      { day: 'Week 2', net: 58 },
      { day: 'Week 3', net: -12 },
      { day: 'Week 4', net: 45 },
    ];
  }, []);

  // Scheduled Messages
  const upcomingMessages = useMemo(() => {
    const msgs = campaigns
      .filter(c => c.status === 'scheduled' || c.status === 'pending_approval' || c.status === 'draft')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3);

    if (msgs.length > 0) return msgs;

    return [
      {
        id: 'msg_1',
        title: 'Camp Registration Reminder',
        scheduledAt: '2026-11-03T19:00:00Z',
        targetSegmentId: 'All Members',
        status: 'scheduled' as const,
        type: 'message'
      },
      {
        id: 'msg_2',
        title: 'New YouTube Short',
        scheduledAt: '2026-11-04T19:00:00Z',
        targetSegmentId: 'Youth (18–25)',
        status: 'scheduled' as const,
        type: 'video'
      },
      {
        id: 'msg_3',
        title: 'Weekend Camp Update',
        scheduledAt: '2026-11-06T19:00:00Z',
        targetSegmentId: 'Camp - Madurai',
        status: 'draft' as const,
        type: 'camp'
      }
    ];
  }, [campaigns]);

  // Scheduled Camps
  const upcomingCamps = useMemo(() => {
    const campList = camps
      .filter(c => (c.status as string) === 'upcoming' || (c.status as string) === 'planned' || c.status === 'ongoing' || c.status === 'registration_open')
      .slice(0, 3);

    if (campList.length > 0) return campList;

    return [
      {
        id: 'c1',
        title: 'Adventure Camp',
        startDate: 'Nov 15, 2026',
        venue: 'Kodaikanal',
        status: 'upcoming' as const,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=80&q=80'
      },
      {
        id: 'c2',
        title: 'Leadership Camp',
        startDate: 'Nov 22, 2026',
        venue: 'Madurai',
        status: 'upcoming' as const,
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=80&q=80'
      },
      {
        id: 'c3',
        title: 'Wellness Camp',
        startDate: 'Dec 6, 2026',
        venue: 'Ooty',
        status: 'planned' as const,
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=80&q=80'
      }
    ];
  }, [camps]);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-[var(--muted-grey)] uppercase tracking-wider">
            GOOD AFTERNOON,
          </div>
          <h1 className="text-[32px] font-bold text-[var(--dark-text)] tracking-tight leading-tight mt-0.5">
            Roshini
          </h1>
          <p className="text-[13px] text-[var(--muted-grey)] mt-0.5">
            Here's what's happening in your community this week.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Light / Dark Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={`Switch to ${isDarkTheme ? 'Light' : 'Dark'} Mode`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--soft-border)] bg-[var(--white)] text-[12px] font-medium text-[var(--dark-text)] hover:bg-[var(--bg-muted)] transition shadow-xs"
            >
              {isDarkTheme ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[var(--forest-green)]" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          )}

          {/* Interactive Date Selector with Scheduled Month Calendar */}
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--soft-border)] bg-[var(--white)] text-[13px] text-[var(--dark-text)] hover:bg-[var(--bg-muted)] transition shadow-xs cursor-pointer select-none"
            >
              <CalendarIcon className="w-4 h-4 text-[#87936C]" />
              <span className="font-medium">
                {calendarMonth.toLocaleString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-grey)] ml-1 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Calendar Popover */}
            {isCalendarOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCalendarOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-72 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-main)]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[13px] font-bold text-[var(--text-main)]">
                      {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-main)]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[10px] font-semibold text-[var(--muted-grey)]">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 pt-1.5 text-center text-xs">
                    {(() => {
                      const year = calendarMonth.getFullYear();
                      const month = calendarMonth.getMonth();
                      const firstDayIndex = new Date(year, month, 1).getDay();
                      const totalDays = new Date(year, month + 1, 0).getDate();

                      const days = [];
                      for (let i = 0; i < firstDayIndex; i++) {
                        days.push(<div key={`empty-${i}`} className="h-7" />);
                      }

                      for (let day = 1; day <= totalDays; day++) {
                        const schedInfo = scheduledDatesMap.get(day);
                        const hasScheduled = !!schedInfo;

                        days.push(
                          <div
                            key={day}
                            title={hasScheduled ? `${schedInfo.count} message(s) scheduled:\n${schedInfo.titles.join('\n')}` : undefined}
                            className={`h-7 w-7 mx-auto flex flex-col items-center justify-center rounded-full text-[11px] font-medium transition cursor-pointer relative ${
                              hasScheduled
                                ? 'bg-[#87936C] text-white font-bold shadow-xs hover:bg-[#77835c]'
                                : 'text-[var(--text-main)] hover:bg-[var(--bg-muted)]'
                            }`}
                          >
                            <span>{day}</span>
                            {hasScheduled && (
                              <span className="w-1 h-1 rounded-full bg-white absolute bottom-0.5" />
                            )}
                          </div>
                        );
                      }
                      return days;
                    })()}
                  </div>

                  {/* Legend Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-card)] flex items-center justify-between text-[11px] text-[var(--text-sub)]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#87936C]" />
                      <span>Scheduled Message</span>
                    </div>
                    <button
                      onClick={() => onNavigateToTab('messages')}
                      className="text-[11px] font-semibold text-[#27833A] hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => onNavigateToTab('settings')}
            className="w-9 h-9 rounded-full border border-[var(--soft-border)] bg-[var(--white)] flex items-center justify-center text-[var(--dark-text)] hover:bg-[var(--bg-muted)] transition relative shadow-xs"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#27833A] absolute top-2 right-2 border-2 border-white"></span>
          </button>
        </div>
      </div>

      {/* ── KPI SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--soft-border)] pt-2">
        {/* KPI 1: Messages Sent */}
        <div className="pr-6 pb-4 md:pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#87936C]/20 flex items-center justify-center text-[#87936C]">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[var(--dark-text)]">Messages Sent</div>
              <div className="text-[11px] text-[var(--muted-grey)]">This Week</div>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-[36px] font-bold text-[var(--dark-text)] tabular-nums tracking-tight">
              {displayTotalSent.toLocaleString()}
            </div>
            <div className="space-y-1 text-right text-[12px]">
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27833A]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  {displaySuccessful.toLocaleString()}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Successful</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C65B42]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  {displayFailed}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Failed</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Delivery Rate */}
        <div className="px-0 md:px-6 py-4 md:py-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#87936C]/20 flex items-center justify-center text-[#87936C]">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-[14px] font-semibold text-[var(--dark-text)]">Delivery Rate</div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-[36px] font-bold text-[var(--dark-text)] tabular-nums tracking-tight">
              {deliveryPercentage}%
            </div>
            <div className="space-y-1 text-right text-[12px]">
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27833A]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  {displayDelivered.toLocaleString()}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Delivered</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-grey)]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  {displayPending}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Pending</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C65B42]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  {displayFailed}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Failed</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Members Activity */}
        <div className="pl-0 md:pl-6 pt-4 md:pt-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#87936C]/20 flex items-center justify-center text-[#87936C]">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-[14px] font-semibold text-[var(--dark-text)]">Members Activity</div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-[36px] font-bold text-[var(--dark-text)] tabular-nums tracking-tight">
              {totalMembers.toLocaleString()}
            </div>
            <div className="space-y-1 text-right text-[12px]">
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27833A]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  +{membersAdded}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Added</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C65B42]"></span>
                <span className="font-semibold text-[var(--dark-text)] tabular-nums">
                  -{membersLeft}
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Left</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="font-semibold text-[#27833A] text-[12px] flex items-center">
                  ↑ 2.1%
                </span>
                <span className="text-[var(--muted-grey)] text-[11px]">Growth</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRAPH SECTION ── */}
      <div className="border-y border-[var(--soft-border)] py-6 my-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--soft-border)]">
          {/* GRAPH 1: Weekly Message Activity */}
          <div className="pr-0 lg:pr-8 pb-6 lg:pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#87936C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 17l5-6 4 4 6-9 5 5" />
                </svg>
                <h3 className="text-[15px] font-bold text-[var(--dark-text)]">
                  Weekly Message Activity
                </h3>
              </div>

              {/* Week / Month Toggle */}
              <div className="flex items-center bg-[var(--bg-muted)] rounded-full p-0.5 text-[11px] font-medium">
                <button
                  onClick={() => setMessageGraphFilter('week')}
                  className={`px-3 py-0.5 rounded-full transition ${
                    messageGraphFilter === 'week'
                      ? 'bg-[#263323] text-white shadow-xs'
                      : 'text-[var(--muted-grey)]'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setMessageGraphFilter('month')}
                  className={`px-3 py-0.5 rounded-full transition ${
                    messageGraphFilter === 'month'
                      ? 'bg-[#263323] text-white shadow-xs'
                      : 'text-[var(--muted-grey)]'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={messageGraphFilter === 'week' ? weeklyMessageData : monthlyMessageData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="sageWaveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#87936C" stopOpacity={0.45} />
                      <stop offset="50%" stopColor="#87936C" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#87936C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--soft-border)" strokeDasharray="3 3" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-grey)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-grey)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 250]}
                    ticks={[0, 50, 100, 150, 200, 250]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#263323] text-white px-2.5 py-1.5 rounded-md text-[11px] shadow-lg">
                            <span className="font-semibold">{payload[0].value}</span> messages
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="natural"
                    dataKey="sent"
                    stroke="#87936C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sageWaveGradient)"
                    dot={{ r: 2.5, fill: '#87936C', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#263323', stroke: '#87936C', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPH 2: Members Added / Left Activity */}
          <div className="pl-0 lg:pl-8 pt-6 lg:pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#87936C]" />
                <h3 className="text-[15px] font-bold text-[var(--dark-text)]">
                  Members Added / Left Activity
                </h3>
              </div>

              {/* Week / Month Toggle */}
              <div className="flex items-center bg-[var(--bg-muted)] rounded-full p-0.5 text-[11px] font-medium">
                <button
                  onClick={() => setMemberGraphFilter('week')}
                  className={`px-3 py-0.5 rounded-full transition ${
                    memberGraphFilter === 'week'
                      ? 'bg-[#263323] text-white shadow-xs'
                      : 'text-[var(--muted-grey)]'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setMemberGraphFilter('month')}
                  className={`px-3 py-0.5 rounded-full transition ${
                    memberGraphFilter === 'month'
                      ? 'bg-[#263323] text-white shadow-xs'
                      : 'text-[var(--muted-grey)]'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={memberGraphFilter === 'week' ? weeklyMemberActivityData : monthlyMemberActivityData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--soft-border)" strokeDasharray="3 3" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-grey)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-grey)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[-60, 80]}
                    ticks={[-60, -40, -20, 0, 20, 40, 60, 80]}
                  />
                  <ReferenceLine y={0} stroke="var(--muted-grey)" strokeWidth={1} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = Number(payload[0].value);
                        return (
                          <div className="bg-[#263323] text-white px-2.5 py-1.5 rounded-md text-[11px] shadow-lg">
                            <span className="font-semibold">{val > 0 ? `+${val}` : val}</span> net change
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="net"
                    stroke="#27833A"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: TWO SIDE-BY-SIDE TABLES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--soft-border)] pt-2">
        {/* LEFT: Scheduled Messages */}
        <div className="pr-0 lg:pr-8 pb-6 lg:pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#87936C]" />
              <h3 className="text-[16px] font-bold text-[var(--dark-text)]">Scheduled Messages</h3>
            </div>
            <button
              onClick={() => onNavigateToTab('messages')}
              className="text-[12px] font-semibold text-[#27833A] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[var(--muted-grey)] text-[11px] font-medium border-b border-[var(--soft-border)]">
                  <th className="pb-2 font-medium">Message</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Audience</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--soft-border)]/50">
                {upcomingMessages.map((msg: any) => {
                  const d = new Date(msg.scheduledAt);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = formatTimeOnly(msg.scheduledAt);

                  return (
                    <tr key={msg.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                      <td className="py-3 font-medium text-[var(--dark-text)] pr-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-[#87936C]/20 flex items-center justify-center text-[#87936C] shrink-0 text-[10px]">
                            {msg.type === 'video' ? '▶' : '✉'}
                          </span>
                          <span className="truncate max-w-[150px]">{msg.title}</span>
                        </div>
                      </td>
                      <td className="py-3 text-[var(--muted-grey)] whitespace-nowrap pr-2">
                        {dateStr}
                      </td>
                      <td className="py-3 text-[var(--muted-grey)] whitespace-nowrap pr-2">
                        {timeStr}
                      </td>
                      <td className="py-3 text-[var(--dark-text)] whitespace-nowrap pr-2">
                        {msg.targetSegmentId === 'seg_all' ? 'All Members' : msg.targetSegmentId}
                      </td>
                      <td className="py-3 whitespace-nowrap pr-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            msg.status === 'scheduled'
                              ? 'bg-[#87936C]/20 text-[#27833A]'
                              : 'bg-[var(--bg-muted)] text-[var(--muted-grey)]'
                          }`}
                        >
                          {msg.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onNavigateToTab('messages')}
                          className="text-[var(--muted-grey)] hover:text-[var(--dark-text)] p-1"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Scheduled Camps */}
        <div className="pl-0 lg:pl-8 pt-6 lg:pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 text-[#87936C]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="m19 20-7-14-7 14h14Z" />
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-[var(--dark-text)]">Scheduled Camps</h3>
            </div>
            <button
              onClick={() => onNavigateToTab('camps')}
              className="text-[12px] font-semibold text-[#27833A] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[var(--muted-grey)] text-[11px] font-medium border-b border-[var(--soft-border)]">
                  <th className="pb-2 font-medium">Camp</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--soft-border)]/50">
                {upcomingCamps.map((camp: any) => (
                  <tr key={camp.id} className="hover:bg-[var(--bg-muted)]/50 transition-colors">
                    <td className="py-3 font-medium text-[var(--dark-text)] pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-6 rounded overflow-hidden bg-[var(--soft-border)] shrink-0">
                          {camp.image ? (
                            <img
                              src={camp.image}
                              alt={camp.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#87936C]/20 flex items-center justify-center text-[10px] text-[var(--forest-green)]">
                              ⛺
                            </div>
                          )}
                        </div>
                        <span className="truncate max-w-[140px] font-medium text-[var(--dark-text)]">
                          {camp.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-[var(--muted-grey)] whitespace-nowrap pr-2">
                      {camp.startDate}
                    </td>
                    <td className="py-3 text-[var(--muted-grey)] whitespace-nowrap pr-2">
                      {camp.venue}
                    </td>
                    <td className="py-3 whitespace-nowrap pr-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          camp.status === 'upcoming'
                            ? 'bg-[#87936C]/20 text-[#27833A]'
                            : 'bg-[var(--bg-muted)] text-[var(--muted-grey)]'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigateToTab('camps')}
                        className="text-[var(--muted-grey)] hover:text-[var(--dark-text)] p-1"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
