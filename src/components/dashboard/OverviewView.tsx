'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Download, 
  Users, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Tag,
  Tent,
  Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { AppState, Campaign } from '@/lib/db/types';
import { formatWhatsAppDate } from '@/lib/utils';

interface OverviewViewProps {
  data: AppState;
  onOpenScheduleModal: (initial?: Partial<Campaign>) => void;
  onOpenAddMember: () => void;
  onOpenCreateCamp: () => void;
  onOpenCreateDiscount: () => void;
  onNavigateToTab: (tab: any) => void;
  onTriggerScheduler: () => void;
}

// Organic wavy brush stroke underline matching the reference screenshot
const BrushStroke: React.FC<{ color: string }> = ({ color }) => (
  <svg 
    viewBox="0 0 240 14" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-3 mt-3 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-105"
    style={{ color }}
  >
    <path 
      d="M3 8C45 3 95 10 145 5C185 2 215 9 237 7C218 11 168 9 128 10C78 11 28 12 3 8Z" 
      fill={color} 
      opacity="0.95"
    />
  </svg>
);

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  onOpenScheduleModal,
  onNavigateToTab
}) => {
  const { members, campaigns, messageLogs, camps, discounts } = data;
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');

  // Metric calculations
  const totalMembers = members.length;
  const verifiedMembers = members.filter(m => m.verificationStatus === 'verified').length;
  const optedInMembers = members.filter(m => m.consentStatus === 'opted_in').length;

  // Next 7 days scheduled campaigns
  const now = new Date();
  const next7DaysEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const scheduledNext7Days = campaigns.filter(c => {
    if (c.status !== 'scheduled' && c.status !== 'pending_approval') return false;
    const t = new Date(c.scheduledAt).getTime();
    return t >= (now.getTime() - 3600000) && t <= next7DaysEnd.getTime();
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Delivery calculations
  const totalSent = messageLogs.filter(l => ['sent', 'delivered', 'read'].includes(l.status)).length;
  const totalDelivered = messageLogs.filter(l => ['delivered', 'read'].includes(l.status)).length;
  const totalRead = messageLogs.filter(l => l.status === 'read').length;

  // Monthly Revenue / Delivery Spline Data (Jan - Dec) matching reference image
  const monthlySplineData = [
    { month: 'Jan', deliveries: 5200, engagements: 2800 },
    { month: 'Feb', deliveries: 4900, engagements: 2600 },
    { month: 'Mar', deliveries: 5800, engagements: 3100 },
    { month: 'Apr', deliveries: 5500, engagements: 2900 },
    { month: 'May', deliveries: 7100, engagements: 3800 },
    { month: 'Jun', deliveries: 6800, engagements: 3500 },
    { month: 'Jul', deliveries: 8400, engagements: 4100 },
    { month: 'Aug', deliveries: 8900, engagements: 4300 },
    { month: 'Sep', deliveries: 9500, engagements: 4700 },
    { month: 'Oct', deliveries: 9800, engagements: 4900 },
    { month: 'Nov', deliveries: 10400, engagements: 5300 },
    { month: 'Dec', deliveries: 11600, engagements: 5900 },
  ];

  // Weekly Orders / Volume Data (Mon - Sun) matching reference image
  const weeklyBarData = [
    { day: 'Mon', delivered: 42, queued: 12 },
    { day: 'Tue', delivered: 58, queued: 15 },
    { day: 'Wed', delivered: 52, queued: 10 },
    { day: 'Thu', delivered: 64, queued: 18 },
    { day: 'Fri', delivered: 74, queued: 22 },
    { day: 'Sat', delivered: 88, queued: 28 },
    { day: 'Sun', delivered: 62, queued: 14 },
  ];

  const nextCamp = camps.length > 0 ? camps[0] : null;
  const activeDiscount = discounts.find(d => new Date(d.validUntil).getTime() > Date.now()) || discounts[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30">
            Scheduled
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Needs approval
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Area matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">
            Home
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, Sophia
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export Button */}
          <button
            onClick={() => onNavigateToTab('members')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121826] hover:bg-[#1a2336] border border-[#1e2a3c] text-xs font-semibold text-slate-200 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>

          {/* New Campaign / Broadcast Button */}
          <button
            onClick={() => onOpenScheduleModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black font-extrabold text-xs transition shadow-[0_0_20px_rgba(194,248,58,0.3)] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Broadcast</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards with Brush Underline matching reference screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Broadcasts Delivered */}
        <div 
          onClick={() => onNavigateToTab('scheduler')}
          className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 hover:border-[#2a3a52] transition-all cursor-pointer relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#c2f83a]/10 border border-[#c2f83a]/20 flex items-center justify-center text-[#c2f83a] font-bold text-base shadow-[0_0_12px_rgba(194,248,58,0.2)]">
              <Radio className="w-4 h-4 text-[#c2f83a]" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#c2f83a]/10 text-[#c2f83a] border border-[#c2f83a]/20">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5%</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              84,254
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total Broadcasts · Dispatched this month
            </div>
          </div>

          <BrushStroke color="#c2f83a" />
        </div>

        {/* Card 2: Total Members / Community Audience */}
        <div 
          onClick={() => onNavigateToTab('members')}
          className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 hover:border-[#2a3a52] transition-all cursor-pointer relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+8.2%</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              12,431
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Active Members · Community reach
            </div>
          </div>

          <BrushStroke color="#38bdf8" />
        </div>

        {/* Card 3: Campaigns Dispatched */}
        <div 
          onClick={() => onNavigateToTab('scheduler')}
          className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 hover:border-[#2a3a52] transition-all cursor-pointer relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Send className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+3.1%</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              3,842
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Campaign Dispatches · Automated queue
            </div>
          </div>

          <BrushStroke color="#a855f7" />
        </div>

        {/* Card 4: Delivery & Read Rate */}
        <div 
          onClick={() => onNavigateToTab('logs')}
          className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 hover:border-[#2a3a52] transition-all cursor-pointer relative overflow-hidden group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#c2f83a] border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+4.6%</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              94.8%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Delivery & Read Rate · High engagement
            </div>
          </div>

          <BrushStroke color="#f59e0b" />
        </div>
      </div>

      {/* Two Main Charts Row matching the reference screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Chart (8 cols): Broadcast & Delivery Overview (Spline Multi-line Area Chart) */}
        <div className="lg:col-span-8 bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2537]">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Broadcast & Delivery Overview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monthly message deliveries vs member reads
                </p>
              </div>

              {/* Timeframe Toggle Pills [Month] [Quarter] [Year] */}
              <div className="flex items-center gap-1 bg-[#0c101c] p-1 rounded-xl border border-[#1a2436]">
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    timeframe === 'month'
                      ? 'bg-[#c2f83a] text-black shadow-[0_0_10px_rgba(194,248,58,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeframe('quarter')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    timeframe === 'quarter'
                      ? 'bg-[#c2f83a] text-black shadow-[0_0_10px_rgba(194,248,58,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quarter
                </button>
                <button
                  onClick={() => setTimeframe('year')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    timeframe === 'year'
                      ? 'bg-[#c2f83a] text-black shadow-[0_0_10px_rgba(194,248,58,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>

            {/* Legend row */}
            <div className="flex items-center gap-4 text-xs text-slate-300 mt-3 mb-2">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c2f83a] shadow-[0_0_6px_rgba(194,248,58,0.7)]"></span>
                <span className="font-medium text-slate-300">Delivered Broadcasts</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.7)]"></span>
                <span className="font-medium text-slate-300">Read & Engaged</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySplineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c2f83a" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#c2f83a" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2638" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#1c2638' }} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#1c2638' }}
                  tickFormatter={(val) => val === 0 ? '0' : `${val.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101726',
                    borderColor: '#1e2b3e',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#f8fafc',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString()} messages`,
                    name === 'deliveries' ? 'Delivered' : 'Read Receipts'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="deliveries" 
                  stroke="#c2f83a" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="engagements" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart (4 cols): Weekly Delivery Volume (Dual Bar Chart) */}
        <div className="lg:col-span-4 bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2537]">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Weekly Delivery Volume
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily sent vs read receipts
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#c2f83a]"></span>
                  <span>Delivered</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8]"></span>
                  <span>Read</span>
                </span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBarData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2638" vertical={false} />
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={{ stroke: '#1c2638' }} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={{ stroke: '#1c2638' }} />
                <Tooltip
                  cursor={{ fill: '#162032/40' }}
                  contentStyle={{
                    backgroundColor: '#101726',
                    borderColor: '#1e2b3e',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#f8fafc',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}
                  formatter={(val: any, name: any) => [`${val} dispatches`, name === 'delivered' ? 'Delivered' : 'Read Receipts']}
                />
                <Bar dataKey="delivered" fill="#c2f83a" radius={[4, 4, 0, 0]} maxBarSize={16} name="delivered" />
                <Bar dataKey="queued" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={16} name="queued" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Content: Upcoming Campaigns & Camps / Promos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scheduled Broadcasts Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#121826] border border-[#1b2537] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1b2537] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Upcoming Scheduled Broadcasts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Queued for automated delivery via WhatsApp Cloud API
              </p>
            </div>
            <button
              onClick={() => onOpenScheduleModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-bold transition shadow-[0_0_10px_rgba(194,248,58,0.3)]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create message</span>
            </button>
          </div>

          {scheduledNext7Days.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No messages currently scheduled for the next 7 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1b2537] bg-[#0c121e]/60 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Campaign</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2537] text-slate-300">
                  {scheduledNext7Days.map(camp => {
                    const segment = data.segments.find(s => s.id === camp.targetSegmentId);
                    return (
                      <tr key={camp.id} className="hover:bg-[#162032]/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {formatWhatsAppDate(camp.scheduledAt)}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-white truncate">{camp.title}</div>
                          <div className="text-[11px] text-slate-400 truncate line-clamp-1">{camp.message}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {segment?.name || 'All Opted-in'} (~{camp.totalRecipients})
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(camp.status)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => onNavigateToTab('scheduler')}
                            className="text-xs text-[#c2f83a] hover:underline font-semibold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3.5 border-t border-[#1b2537] bg-[#0c121e]/40 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {scheduledNext7Days.length} scheduled broadcasts</span>
            <button
              onClick={() => onNavigateToTab('scheduler')}
              className="text-[#c2f83a] hover:text-[#b0e82e] font-semibold inline-flex items-center gap-1.5 transition"
            >
              <span>Open full scheduler</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Cards: Active Camp & Discount (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Next Upcoming Camp Card */}
          {nextCamp && (
            <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-xl hover:border-[#27364e] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Featured Camp Event
                </span>
                <button
                  onClick={() => onNavigateToTab('camps')}
                  className="text-xs text-[#c2f83a] hover:underline font-semibold"
                >
                  View all
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#c2f83a]/10 border border-[#c2f83a]/20 text-[#c2f83a] shrink-0">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{nextCamp.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{nextCamp.subtitle}</p>
                </div>
              </div>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{nextCamp.startDate} to {nextCamp.endDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{nextCamp.venue}</span>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mt-4 pt-3.5 border-t border-[#1b2537]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-mono">
                    {nextCamp.registeredCount} / {nextCamp.maxCapacity} Seats Filled
                  </span>
                  <span className="font-extrabold text-[#c2f83a] font-mono">{nextCamp.fee}</span>
                </div>
                <div className="w-full bg-[#1c2738] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#c2f83a] h-full rounded-full shadow-[0_0_8px_rgba(194,248,58,0.6)]" 
                    style={{ width: `${Math.min(100, (nextCamp.registeredCount / nextCamp.maxCapacity) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Active Promo Offer Card */}
          {activeDiscount && (
            <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-xl hover:border-[#27364e] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Exclusive Promo Offer
                </span>
                <button
                  onClick={() => onNavigateToTab('discounts')}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  View offers
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeDiscount.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{activeDiscount.description}</p>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between p-2.5 rounded-xl bg-[#0c121e] border border-[#1b2537]">
                <div className="font-mono text-xs font-bold text-white tracking-wider">
                  {activeDiscount.code}
                </div>
                <div className="text-xs font-extrabold text-cyan-400">
                  {activeDiscount.discountType === 'percentage' ? `${activeDiscount.discountValue}% OFF` : `₹${activeDiscount.discountValue} OFF`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
