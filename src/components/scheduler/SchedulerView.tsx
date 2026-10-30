'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  List, 
  Eye, 
  Copy, 
  Play, 
  Ban, 
  FileEdit,
  X,
  AlertCircle,
  Repeat,
  Clock,
  Smartphone,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Send,
  MessageSquareQuote,
  BellRing
} from 'lucide-react';
import { Campaign, AudienceSegment, Member, CampaignStatus, RecurrenceCadence } from '@/lib/db/types';
import { formatWhatsAppDate, formatTimeOnly } from '@/lib/utils';
import { WhatsAppChatPreview } from '../preview/WhatsAppChatPreview';

interface SchedulerViewProps {
  campaigns: Campaign[];
  segments: AudienceSegment[];
  members: Member[];
  onOpenComposer: (campaign?: Partial<Campaign>) => void;
  onApproveCampaign: (campaignId: string) => Promise<void>;
  onCancelCampaign: (campaignId: string) => Promise<void>;
  onDuplicateCampaign: (campaignId: string) => Promise<void>;
  onSendNow: (campaignId: string) => Promise<void>;
  defaultView?: 'calendar' | 'agenda' | 'cadence_viewer';
  onOpenCareAlarms?: () => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  campaigns,
  segments,
  members,
  onOpenComposer,
  onApproveCampaign,
  onCancelCampaign,
  onDuplicateCampaign,
  onSendNow,
  defaultView = 'calendar',
  onOpenCareAlarms
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda' | 'cadence_viewer'>(defaultView);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'daily' | 'every_3_days' | 'every_5_days' | 'weekly' | 'one_off'>('all');

  // Compute dates for the selected week (Monday to Sunday)
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + (offset * 7));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDates(weekOffset);
  const startDay = weekDays[0];
  const endDay = weekDays[6];

  const formatDateRange = () => {
    const startStr = startDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && 
           d.getMonth() === now.getMonth() && 
           d.getFullYear() === now.getFullYear();
  };

  // Cadence matching filter
  const matchesCadence = (c: Campaign) => {
    if (cadenceFilter === 'all') return true;
    if (cadenceFilter === 'one_off') return !c.cadence || c.cadence === 'none';
    return c.cadence === cadenceFilter;
  };

  // Get campaigns for a specific date (filtered by active cadence)
  const getCampaignsForDate = (date: Date) => {
    return campaigns.filter(c => {
      const cDate = new Date(c.scheduledAt);
      const isDateMatch = cDate.getDate() === date.getDate() &&
             cDate.getMonth() === date.getMonth() &&
             cDate.getFullYear() === date.getFullYear();
      return isDateMatch && matchesCadence(c);
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  // Agenda list of campaigns for this week
  const weekStartTs = startDay.getTime();
  const weekEndTs = new Date(endDay).setHours(23, 59, 59, 999);
  const weekCampaigns = campaigns.filter(c => {
    const t = new Date(c.scheduledAt).getTime();
    return t >= weekStartTs && t <= weekEndTs && matchesCadence(c);
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Cadence counts for quick-filter tabs
  const dailyCount = campaigns.filter(c => c.cadence === 'daily').length;
  const every3DaysCount = campaigns.filter(c => c.cadence === 'every_3_days').length;
  const every5DaysCount = campaigns.filter(c => c.cadence === 'every_5_days').length;
  const weeklyCount = campaigns.filter(c => c.cadence === 'weekly').length;
  const oneOffCount = campaigns.filter(c => !c.cadence || c.cadence === 'none').length;
  const repetitiveTotalCount = campaigns.filter(c => c.cadence && c.cadence !== 'none').length;

  // Group repetitive campaigns for Message Viewer
  const repetitiveCampaigns = campaigns.filter(c => c.cadence && c.cadence !== 'none');
  const filteredRepetitive = repetitiveCampaigns.filter(matchesCadence);

  // Group by series root
  const seriesRootsMap = new Map<string, Campaign[]>();
  filteredRepetitive.forEach(camp => {
    const rootId = camp.parentCampaignId || camp.id;
    if (!seriesRootsMap.has(rootId)) {
      seriesRootsMap.set(rootId, []);
    }
    seriesRootsMap.get(rootId)!.push(camp);
  });

  // Sort each group by scheduled time
  seriesRootsMap.forEach(list => {
    list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  });

  // Count items needing approval
  const needsApprovalCount = campaigns.filter(c => c.status === 'pending_approval').length;

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Scheduled</span>;
      case 'pending_approval':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">Needs approval</span>;
      case 'completed':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">Cancelled</span>;
      case 'draft':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">Draft</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30 capitalize">{status}</span>;
    }
  };

  const getCadenceBadge = (camp: Campaign) => {
    if (!camp.cadence || camp.cadence === 'none') return null;
    switch (camp.cadence) {
      case 'daily':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-xs">
            <Repeat className="w-2.5 h-2.5" />
            Daily
            {camp.seriesIndex ? ` #${camp.seriesIndex}` : ''}
          </span>
        );
      case 'every_3_days':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30 shadow-xs">
            <Repeat className="w-2.5 h-2.5" />
            3-Days Once
            {camp.seriesIndex ? ` #${camp.seriesIndex}` : ''}
          </span>
        );
      case 'every_5_days':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs">
            <Repeat className="w-2.5 h-2.5" />
            5-Days Once
            {camp.seriesIndex ? ` #${camp.seriesIndex}` : ''}
          </span>
        );
      case 'weekly':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">
            <Repeat className="w-2.5 h-2.5" />
            Weekly
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30 shadow-xs">
            <Repeat className="w-2.5 h-2.5" />
            {camp.cadenceIntervalDays}d Once
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Needs Approval Banner if pending */}
      {needsApprovalCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">{needsApprovalCount} message{needsApprovalCount > 1 ? 's' : ''} require administrative review</strong> before automated dispatch.
            </span>
          </div>
          <button
            onClick={() => setViewMode('agenda')}
            className="text-xs font-bold text-[#c2f83a] hover:underline"
          >
            Review in Agenda
          </button>
        </div>
      )}

      {/* Date Navigation & Controls Header in Dark Theme */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: Previous, Next, Today, Date Range */}
        <div className="flex items-center gap-2.5">
          {viewMode !== 'cadence_viewer' && (
            <>
              <div className="flex items-center border border-[#1e2a3c] rounded-xl overflow-hidden bg-[#141c2c]">
                <button
                  onClick={() => setWeekOffset(w => w - 1)}
                  className="p-2 hover:bg-[#1f2b40] text-slate-300 border-r border-[#1e2a3c] transition"
                  title="Previous week"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="p-2 hover:bg-[#1f2b40] text-slate-300 transition"
                  title="Next week"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setWeekOffset(0)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                  weekOffset === 0 
                    ? 'bg-[#c2f83a] text-black border-[#c2f83a] shadow-[0_0_10px_rgba(194,248,58,0.4)]' 
                    : 'bg-[#141c2c] text-slate-300 border-[#1e2a3c] hover:bg-[#1f2b40]'
                }`}
              >
                Today
              </button>

              <span className="text-xs font-bold text-white ml-1">
                {formatDateRange()}
              </span>
            </>
          )}

          {viewMode === 'cadence_viewer' && (
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30">
                <Repeat className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">
                  Repetitive Cadence Message Viewer
                </div>
                <div className="text-[11px] text-slate-400">
                  {repetitiveTotalCount} recurring messages scheduled ({seriesRootsMap.size} active cadence series)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: View Toggle (Calendar / Agenda / Message Viewer) & New Message */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-[#0c101c] border border-[#1b2537] text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-[#c2f83a] text-black shadow-[0_0_10px_rgba(194,248,58,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'agenda'
                  ? 'bg-[#c2f83a] text-black shadow-[0_0_10px_rgba(194,248,58,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3 h-3" />
              <span>Agenda</span>
            </button>

            <button
              onClick={() => setViewMode('cadence_viewer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'cadence_viewer'
                  ? 'bg-[#c2f83a] text-black shadow-[0_0_10px_rgba(194,248,58,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Inspect repetitive daily, 3-days once, and 5-days once messages"
            >
              <Repeat className="w-3 h-3" />
              <span>Message Viewer</span>
            </button>
          </div>

          {onOpenCareAlarms && (
            <button
              onClick={onOpenCareAlarms}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-200 text-xs font-semibold transition shadow-xs"
              title="Clock Alarms: Reminders to eat or take medicine for elderly customers"
            >
              <BellRing className="w-3.5 h-3.5 text-[#c2f83a]" />
              <span>Care Alarms</span>
            </button>
          )}

          <button
            onClick={() => onOpenComposer()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold transition shadow-[0_0_15px_rgba(194,248,58,0.3)] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New message</span>
          </button>
        </div>
      </div>

      {/* Cadence Filter Pills Toolbar */}
      <div className="bg-[#0e1422] border border-[#1b2537] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#c2f83a]" />
            Filter by Cadence:
          </span>

          <button
            onClick={() => setCadenceFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              cadenceFilter === 'all'
                ? 'bg-[#182738] text-[#c2f83a] border border-[#c2f83a]/60 shadow-[0_0_8px_rgba(194,248,58,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c] border border-transparent'
            }`}
          >
            All Messages ({campaigns.length})
          </button>

          <button
            onClick={() => setCadenceFilter('daily')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              cadenceFilter === 'daily'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c] border border-transparent'
            }`}
          >
            <span>⚡ Daily</span>
            <span className="text-[10px] font-mono px-1 rounded bg-sky-500/20 text-sky-300">{dailyCount}</span>
          </button>

          <button
            onClick={() => setCadenceFilter('every_3_days')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              cadenceFilter === 'every_3_days'
                ? 'bg-[#c2f83a]/20 text-[#c2f83a] border border-[#c2f83a]/50 shadow-[0_0_8px_rgba(194,248,58,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c] border border-transparent'
            }`}
          >
            <span>🔁 3 Days Once</span>
            <span className="text-[10px] font-mono px-1 rounded bg-[#c2f83a]/20 text-[#c2f83a]">{every3DaysCount}</span>
          </button>

          <button
            onClick={() => setCadenceFilter('every_5_days')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              cadenceFilter === 'every_5_days'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c] border border-transparent'
            }`}
          >
            <span>🚀 5 Days Once</span>
            <span className="text-[10px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">{every5DaysCount}</span>
          </button>

          <button
            onClick={() => setCadenceFilter('weekly')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              cadenceFilter === 'weekly'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c] border border-transparent'
            }`}
          >
            <span>📅 Weekly</span>
            <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">{weeklyCount}</span>
          </button>

          <button
            onClick={() => setCadenceFilter('one_off')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              cadenceFilter === 'one_off'
                ? 'bg-[#182738] text-slate-200 border border-[#1e2a3c]'
                : 'text-slate-400 hover:text-white hover:bg-[#141c2c] border border-transparent'
            }`}
          >
            One-off ({oneOffCount})
          </button>
        </div>

        {cadenceFilter !== 'all' && (
          <button
            onClick={() => setCadenceFilter('all')}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <X className="w-3 h-3" />
            <span>Clear Cadence Filter</span>
          </button>
        )}
      </div>

      {/* VIEW 1: WEEKLY CALENDAR IN DARK THEME */}
      {viewMode === 'calendar' && (
        <div className="bg-[#121826] border border-[#1b2537] rounded-2xl shadow-xl overflow-hidden">
          {/* 7 Column Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#1b2537] min-h-[500px]">
            {weekDays.map((day) => {
              const dayCampaigns = getCampaignsForDate(day);
              const today = isToday(day);

              return (
                <div 
                  key={day.toISOString()} 
                  className={`flex flex-col ${today ? 'bg-[#162032]/40' : 'bg-[#121826]'}`}
                >
                  {/* Day Column Header */}
                  <div className={`p-3 border-b border-[#1b2537] text-center ${today ? 'bg-[#c2f83a]/10' : 'bg-[#0c121e]/70'}`}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-sm font-extrabold mt-1 inline-block px-2 py-0.5 rounded-lg ${
                      today ? 'bg-[#c2f83a] text-black shadow-[0_0_8px_rgba(194,248,58,0.5)]' : 'text-white'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Campaign Cards in this Day */}
                  <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                    {dayCampaigns.map(camp => {
                      const seg = segments.find(s => s.id === camp.targetSegmentId);
                      return (
                        <div
                          key={camp.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition ${
                            camp.status === 'pending_approval'
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : camp.status === 'scheduled'
                              ? 'bg-[#141c2c] border-[#1e2a3c] hover:border-[#2b3a50] shadow-md'
                              : 'bg-[#0c121e] border-[#1b2537] text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="font-mono text-slate-300 font-semibold">
                              {formatTimeOnly(camp.scheduledAt)}
                            </span>
                            {getStatusBadge(camp.status)}
                          </div>

                          {/* Cadence Badge if recurring */}
                          {camp.cadence && camp.cadence !== 'none' && (
                            <div>
                              {getCadenceBadge(camp)}
                            </div>
                          )}

                          <div 
                            onClick={() => setPreviewCampaign(camp)}
                            className="font-bold text-white hover:text-[#c2f83a] cursor-pointer line-clamp-2 leading-tight transition"
                            title="Click to view message details in WhatsApp Simulator"
                          >
                            {camp.title}
                          </div>

                          <div className="text-[10px] text-slate-400 truncate">
                            Audience: {seg?.name || 'All'} (~{camp.totalRecipients})
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-2 border-t border-[#1b2537] flex items-center justify-end gap-1.5">
                            {camp.status === 'pending_approval' && (
                              <button
                                onClick={() => onApproveCampaign(camp.id)}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#c2f83a] text-black hover:bg-[#b0e82e]"
                                title="Approve for delivery"
                              >
                                Approve
                              </button>
                            )}

                            {camp.status === 'scheduled' && (
                              <button
                                onClick={() => onSendNow(camp.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#c2f83a] hover:bg-[#1a253a]"
                                title="Send immediately"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => onOpenComposer(camp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253a]"
                              title="Edit message"
                            >
                              <FileEdit className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => setPreviewCampaign(camp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#c2f83a] hover:bg-[#1a253a]"
                              title="Inspect in Message Viewer"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {dayCampaigns.length === 0 && (
                      <div className="h-full flex items-center justify-center py-8 text-[11px] text-slate-600">
                        —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: AGENDA VIEW IN DARK THEME */}
      {viewMode === 'agenda' && (
        <div className="bg-[#121826] border border-[#1b2537] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1b2537] flex items-center justify-between bg-[#0c121e]/60">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Weekly Message Agenda ({weekCampaigns.length} total)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Scheduled delivery timeline, repetitive cadences, audience segmentation, and approvals
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {formatDateRange()}
            </span>
          </div>

          {weekCampaigns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No broadcasts scheduled during {formatDateRange()} matching the active filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1b2537] bg-[#0c121e]/80 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Scheduled Time</th>
                    <th className="py-3 px-4">Cadence</th>
                    <th className="py-3 px-4">Campaign & Content</th>
                    <th className="py-3 px-4">Audience & Reach</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2537] text-slate-300">
                  {weekCampaigns.map(camp => {
                    const seg = segments.find(s => s.id === camp.targetSegmentId);
                    return (
                      <tr key={camp.id} className="hover:bg-[#162032]/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400 align-top">
                          <div>{formatWhatsAppDate(camp.scheduledAt)}</div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap align-top">
                          {camp.cadence && camp.cadence !== 'none' ? (
                            getCadenceBadge(camp)
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">One-off</span>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-sm align-top">
                          <div 
                            onClick={() => setPreviewCampaign(camp)}
                            className="font-bold text-white hover:text-[#c2f83a] cursor-pointer transition"
                          >
                            {camp.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {camp.message}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap align-top">
                          <div className="font-semibold text-slate-200">{seg?.name || 'All Members'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">~{camp.totalRecipients} recipients</div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap align-top">
                          {getStatusBadge(camp.status)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap align-top space-x-1">
                          {camp.status === 'pending_approval' && (
                            <button
                              onClick={() => onApproveCampaign(camp.id)}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-[#c2f83a] hover:bg-[#b0e82e] text-black shadow-xs"
                            >
                              Approve
                            </button>
                          )}

                          {camp.status === 'scheduled' && (
                            <button
                              onClick={() => onSendNow(camp.id)}
                              className="px-3 py-1 rounded-xl text-xs font-semibold border border-[#1e2a3c] bg-[#141c2c] text-slate-200 hover:bg-[#1f2b40]"
                              title="Dispatch immediately"
                            >
                              Send now
                            </button>
                          )}

                          <button
                            onClick={() => onOpenComposer(camp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253a]"
                            title="Edit"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateCampaign(camp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253a]"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setPreviewCampaign(camp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#c2f83a] hover:bg-[#1a253a]"
                            title="Inspect in Message Viewer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {['scheduled', 'pending_approval'].includes(camp.status) && (
                            <button
                              onClick={() => onCancelCampaign(camp.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
                              title="Cancel"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DEDICATED CADENCE MESSAGE VIEWER */}
      {viewMode === 'cadence_viewer' && (
        <div className="space-y-4">
          {/* Header Info Banner */}
          <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Repetitive Message Viewer & Cadence Series
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30">
                    Live Scheduler Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Inspect and manage repetitive messages scheduled across daily, 3-day, and 5-day cadences. Review full message text, preview WhatsApp delivery, track sequence occurrences, and trigger instant test dispatches.
                </p>
              </div>

              <button
                onClick={() => onOpenComposer()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold transition shadow-[0_0_15px_rgba(194,248,58,0.3)]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Schedule New Cadence</span>
              </button>
            </div>
          </div>

          {/* Cadence Series Cards */}
          {seriesRootsMap.size === 0 ? (
            <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-12 text-center space-y-3">
              <Repeat className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400">
                No repetitive cadence messages match the current filter.
              </div>
              <button
                onClick={() => setCadenceFilter('all')}
                className="text-xs font-bold text-[#c2f83a] hover:underline"
              >
                Reset filter to view all repetitive messages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from(seriesRootsMap.entries()).map(([rootId, occurrences]) => {
                const primary = occurrences[0];
                const seg = segments.find(s => s.id === primary.targetSegmentId);
                const nextScheduled = occurrences.find(o => o.status === 'scheduled' || o.status === 'pending_approval') || primary;

                return (
                  <div
                    key={rootId}
                    className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 space-y-4 shadow-xl hover:border-[#2b3a50] transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Cadence Type Badge & Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getCadenceBadge(primary)}
                          <span className="text-[11px] font-mono text-slate-400">
                            {occurrences.length} scheduled occurrence{occurrences.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(nextScheduled.status)}
                          <button
                            onClick={() => setPreviewCampaign(nextScheduled)}
                            className="p-1.5 rounded-lg bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-300 hover:text-[#c2f83a] transition"
                            title="Open in WhatsApp Simulator"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Audience */}
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {primary.title.replace(/\s*\[Occurrence.*\]/i, '')}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>Audience: <strong className="text-slate-200">{seg?.name || 'All Opted-in'}</strong></span>
                          <span>•</span>
                          <span>Reach: <strong className="text-[#c2f83a] font-mono">~{primary.totalRecipients} leads</strong></span>
                        </div>
                      </div>

                      {/* WhatsApp Message Content Viewer Box */}
                      <div className="p-3.5 rounded-xl bg-[#0a0f18] border border-[#1b2537] text-xs font-mono text-slate-200 leading-relaxed space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1b2537] text-[10px] text-slate-500 font-sans">
                          <span className="flex items-center gap-1">
                            <MessageSquareQuote className="w-3 h-3 text-[#c2f83a]" />
                            Message Template Preview
                          </span>
                          <span>WhatsApp Broadcast</span>
                        </div>

                        {primary.mediaUrl && (
                          <div className="relative rounded-lg overflow-hidden h-28 w-full border border-[#1b2537]">
                            <img
                              src={primary.mediaUrl}
                              alt="Broadcast media"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-slate-300">
                              Attached media
                            </span>
                          </div>
                        )}

                        <div className="whitespace-pre-line text-slate-300 text-[11px] max-h-32 overflow-y-auto pr-1">
                          {primary.message}
                        </div>
                      </div>

                      {/* Sequence Occurrences Timeline */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-[#c2f83a]" />
                            Occurrence Dispatch Timeline:
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Interval: {primary.cadence === 'daily' ? '1 Day' : primary.cadence === 'every_3_days' ? '3 Days' : primary.cadence === 'every_5_days' ? '5 Days' : `${primary.cadenceIntervalDays || 7} Days`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {occurrences.map((occ, idx) => {
                            const isPast = new Date(occ.scheduledAt).getTime() < Date.now();
                            const isNext = occ.id === nextScheduled.id;

                            return (
                              <button
                                key={occ.id}
                                onClick={() => setPreviewCampaign(occ)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 transition text-left ${
                                  isNext
                                    ? 'bg-[#182738] border-[#c2f83a] text-white shadow-[0_0_8px_rgba(194,248,58,0.25)]'
                                    : isPast
                                    ? 'bg-[#101726] border-[#1b2537] text-slate-500 opacity-60'
                                    : 'bg-[#141c2c] border-[#1e2a3c] text-slate-300 hover:border-[#2b3a50]'
                                }`}
                                title={`Occurrence #${idx + 1}: ${occ.title}`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  isNext ? 'bg-[#c2f83a] text-black' : 'bg-[#1b2537] text-slate-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <div>{new Date(occ.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                  <div className="text-[9px] text-slate-500">{formatTimeOnly(occ.scheduledAt)}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-3 border-t border-[#1b2537] flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-400">
                        Next: <strong className="text-white">{formatWhatsAppDate(nextScheduled.scheduledAt)}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {nextScheduled.status === 'scheduled' && (
                          <button
                            onClick={() => onSendNow(nextScheduled.id)}
                            className="px-3 py-1.5 rounded-xl border border-[#1e2a3c] bg-[#141c2c] hover:bg-[#1f2b40] text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                            title="Execute immediate test dispatch"
                          >
                            <Send className="w-3 h-3 text-[#c2f83a]" />
                            <span>Send Next</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPreviewCampaign(nextScheduled)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold flex items-center gap-1 transition shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Full Message</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Message Viewer & WhatsApp Smartphone Simulator Modal */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#101726] border border-[#1b2537] rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1b2537]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {previewCampaign.title}
                    </h3>
                    {getCadenceBadge(previewCampaign)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    WhatsApp Message Simulator & Cadence Dispatch Inspector
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewCampaign(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1a253a] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Grid: Cadence Meta on left (7 cols), Smartphone Simulator on right (5 cols) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Cadence Details & Full Text (7 cols) */}
              <div className="md:col-span-7 space-y-3.5 text-xs">
                {/* Cadence Meta Card */}
                <div className="p-3.5 rounded-2xl bg-[#0c121e] border border-[#1b2537] space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-[#c2f83a]" />
                    Cadence & Delivery Specifications
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-[#141c2c] border border-[#1e2a3c]">
                      <div className="text-[10px] text-slate-500">Repetition Frequency</div>
                      <div className="font-bold text-white capitalize mt-0.5">
                        {previewCampaign.cadence === 'daily'
                          ? 'Daily (Every 1 Day)'
                          : previewCampaign.cadence === 'every_3_days'
                          ? 'Every 3 Days'
                          : previewCampaign.cadence === 'every_5_days'
                          ? 'Every 5 Days'
                          : previewCampaign.cadence === 'weekly'
                          ? 'Weekly'
                          : previewCampaign.cadence === 'custom_days'
                          ? `Every ${previewCampaign.cadenceIntervalDays} Days`
                          : 'One-off broadcast'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#141c2c] border border-[#1e2a3c]">
                      <div className="text-[10px] text-slate-500">Scheduled Dispatch</div>
                      <div className="font-bold text-[#c2f83a] font-mono mt-0.5">
                        {formatWhatsAppDate(previewCampaign.scheduledAt)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#141c2c] border border-[#1e2a3c]">
                      <div className="text-[10px] text-slate-500">Target Audience</div>
                      <div className="font-bold text-slate-200 mt-0.5">
                        {segments.find(s => s.id === previewCampaign.targetSegmentId)?.name || 'All Opted-in'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#141c2c] border border-[#1e2a3c]">
                      <div className="text-[10px] text-slate-500">Estimated Reach</div>
                      <div className="font-bold text-white font-mono mt-0.5">
                        ~{previewCampaign.totalRecipients} members
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Message Text View */}
                <div className="p-3.5 rounded-2xl bg-[#0c121e] border border-[#1b2537] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Full Raw Message Content</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(previewCampaign.message);
                        alert('Message text copied to clipboard!');
                      }}
                      className="text-[10px] font-mono text-[#c2f83a] hover:underline flex items-center gap-1 lowercase"
                    >
                      <Copy className="w-3 h-3" />
                      copy text
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141c2c] border border-[#1e2a3c] font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                    {previewCampaign.message}
                  </div>
                </div>

                {/* Series Occurrences Chain (if recurring) */}
                {previewCampaign.parentCampaignId && (
                  <div className="p-3.5 rounded-2xl bg-[#0c121e] border border-[#1b2537] space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Series Occurrences Chain
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {campaigns
                        .filter(c => (c.parentCampaignId === previewCampaign.parentCampaignId || c.id === previewCampaign.parentCampaignId))
                        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                        .map((occ, idx) => (
                          <div
                            key={occ.id}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                              occ.id === previewCampaign.id
                                ? 'bg-[#c2f83a] text-black font-bold border-[#c2f83a]'
                                : 'bg-[#141c2c] border-[#1e2a3c] text-slate-300'
                            }`}
                          >
                            <span>#{idx + 1}</span>
                            <span>{new Date(occ.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Smartphone WhatsApp Simulator (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#0c121e] rounded-2xl p-4 border border-[#1b2537]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-[#c2f83a]" />
                  Simulated WhatsApp Client
                </div>

                <WhatsAppChatPreview
                  message={previewCampaign.message}
                  mediaUrl={previewCampaign.mediaUrl}
                  mediaType={previewCampaign.mediaType}
                  linkPreviewUrl={previewCampaign.linkPreviewUrl}
                  timestamp={previewCampaign.scheduledAt}
                />
              </div>
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="pt-3 border-t border-[#1b2537] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {previewCampaign.status === 'pending_approval' && (
                  <button
                    onClick={async () => {
                      await onApproveCampaign(previewCampaign.id);
                      setPreviewCampaign(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold shadow-md transition"
                  >
                    Approve for Delivery
                  </button>
                )}

                {previewCampaign.status === 'scheduled' && (
                  <button
                    onClick={async () => {
                      await onSendNow(previewCampaign.id);
                      setPreviewCampaign(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#141c2c] hover:bg-[#1f2b40] border border-[#1e2a3c] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-[#c2f83a]" />
                    <span>Send Immediate Test</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenComposer(previewCampaign);
                    setPreviewCampaign(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#141c2c] hover:bg-[#1f2b40] border border-[#1e2a3c] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit in Composer</span>
                </button>
              </div>

              <button
                onClick={() => setPreviewCampaign(null)}
                className="px-4 py-2 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] text-slate-300 text-xs font-semibold transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
