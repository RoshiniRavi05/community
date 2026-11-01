'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  List, 
  Eye, 
  Copy, 
  Play, 
  Trash2,
  FileEdit,
  X,
  AlertCircle,
  Repeat,
  Clock,
  CheckCircle2,
  Send,
  Search,
  Check,
  Ban
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
  defaultView?: 'table' | 'weekly_calendar' | 'monthly_calendar' | 'agenda';
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
  defaultView = 'table'
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'weekly_calendar' | 'monthly_calendar' | 'agenda'>(defaultView);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [monthOffset, setMonthOffset] = useState(0);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered campaigns for table view
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = c.title.toLowerCase().includes(q) ||
          c.message.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.targetSegmentId.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [campaigns, search, statusFilter]);

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

  // Get campaigns for a specific date
  const getCampaignsForDate = (date: Date) => {
    return campaigns.filter(c => {
      const cDate = new Date(c.scheduledAt);
      return cDate.getDate() === date.getDate() &&
             cDate.getMonth() === date.getMonth() &&
             cDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  // Status Badge Helper
  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#16a34a]/15 text-[#22c55e] border border-[#16a34a]/30">
            Scheduled
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Pending Approval
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse">
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Delivered
          </span>
        );
      case 'failed':
      case 'partially_failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50">
            Cancelled
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            Draft
          </span>
        );
    }
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredCampaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCampaigns.map(c => c.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Handle Delete Selected
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to cancel / remove ${selectedIds.size} selected messages?`)) return;
    setIsDeleting(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await onCancelCampaign(id);
      }
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP TOOLBAR (Wireframe 3: Search, Delete Selected, Schedule, Calendar, +Add) */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-md p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages by title, content preview, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#090d16] border border-[#1e293b] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#16a34a]"
            />
          </div>

          {/* Action buttons matching Wireframe 3 */}
          <div className="flex items-center gap-2">
            {/* Delete Selected (when items are selected) */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/60 transition text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* View Switchers: Schedule / History, Calendar, Agenda */}
            <div className="inline-flex rounded-md bg-[#090d16] p-0.5 border border-[#1e293b] text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-[#16a34a] text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Schedule Table</span>
              </button>

              <button
                onClick={() => setViewMode('weekly_calendar')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                  viewMode === 'weekly_calendar'
                    ? 'bg-[#16a34a] text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Weekly Calendar</span>
              </button>

              <button
                onClick={() => setViewMode('agenda')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                  viewMode === 'agenda'
                    ? 'bg-[#16a34a] text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            {/* + Add Message */}
            <button
              onClick={() => onOpenComposer()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Message</span>
            </button>
          </div>
        </div>

        {/* Filter bar for statuses */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-medium">Filter Status:</span>
            {(['all', 'scheduled', 'pending_approval', 'completed', 'draft', 'cancelled'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition ${
                  statusFilter === st
                    ? 'bg-[#162032] text-slate-100 border border-[#273549]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all' ? 'All Messages' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {filteredCampaigns.length} total messages
          </span>
        </div>
      </div>

      {/* 2. MAIN VIEW CONTENT */}
      {viewMode === 'table' && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-[10px] text-slate-400 uppercase font-semibold border-b border-[#1e293b]">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded bg-[#0d121f] border-[#273549] text-[#16a34a] focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-3">Message Title</th>
                  <th className="py-2.5 px-3">Content Preview</th>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Scheduled Time</th>
                  <th className="py-2.5 px-3">Audience</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      No messages found matching search or filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => {
                    const isSelected = selectedIds.has(camp.id);
                    const d = new Date(camp.scheduledAt);
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const timeStr = formatTimeOnly(camp.scheduledAt);

                    return (
                      <tr
                        key={camp.id}
                        className={`hover:bg-[#151c2c] transition-colors ${isSelected ? 'bg-[#16a34a]/5' : ''}`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(camp.id)}
                            className="rounded bg-[#0d121f] border-[#273549] text-[#16a34a] focus:ring-0"
                          />
                        </td>

                        {/* Title */}
                        <td className="py-2.5 px-3 font-medium text-slate-100 max-w-[180px] truncate">
                          {camp.title}
                        </td>

                        {/* Content Preview */}
                        <td className="py-2.5 px-3 text-slate-400 max-w-[240px] truncate" title={camp.message}>
                          {camp.message.replace(/\*/g, '').slice(0, 75)}...
                        </td>

                        {/* Scheduled Date */}
                        <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {dateStr}
                        </td>

                        {/* Scheduled Time (e.g. 7:00 PM) */}
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          <span className={timeStr.includes('7:00') ? 'text-[#22c55e] font-semibold' : 'text-slate-300'}>
                            {timeStr}
                          </span>
                        </td>

                        {/* Audience */}
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap text-[11px]">
                          {camp.targetSegmentId === 'seg_all' ? 'All Community' : camp.targetSegmentId}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getStatusBadge(camp.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {camp.status === 'pending_approval' && (
                              <button
                                onClick={() => onApproveCampaign(camp.id)}
                                title="Approve Campaign"
                                className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-medium"
                              >
                                Approve
                              </button>
                            )}

                            {(camp.status === 'scheduled' || camp.status === 'draft') && (
                              <button
                                onClick={() => onSendNow(camp.id)}
                                title="Dispatch Message Now"
                                className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-[10px] font-medium"
                              >
                                Send Now
                              </button>
                            )}

                            <button
                              onClick={() => setPreviewCampaign(camp)}
                              title="Live WhatsApp Preview"
                              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onOpenComposer(camp)}
                              title="Edit / Reschedule"
                              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDuplicateCampaign(camp.id)}
                              title="Duplicate for Next Week"
                              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {camp.status !== 'completed' && camp.status !== 'cancelled' && (
                              <button
                                onClick={() => onCancelCampaign(camp.id)}
                                title="Cancel Campaign"
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. WEEKLY CALENDAR VIEW (Wireframe 3: Weekly Planning & 7:00 PM Slot) */}
      {viewMode === 'weekly_calendar' && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-md p-4 space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-1.5 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 rounded bg-[#162032] border border-[#273549] text-xs font-medium text-slate-300 hover:text-white"
              >
                This Week
              </button>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-1.5 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-200 text-xs ml-2">
                {formatDateRange()}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
                <span>7:00 PM Broadcast Window</span>
              </span>
            </div>
          </div>

          {/* 7 Columns for Monday to Sunday */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((date, idx) => {
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = date.getDate();
              const isToday = new Date().toDateString() === date.toDateString();
              const daysCampaigns = getCampaignsForDate(date);

              return (
                <div
                  key={idx}
                  className={`bg-[#090d16] border rounded-md p-2 flex flex-col justify-between min-h-[300px] ${
                    isToday ? 'border-[#16a34a]/60 shadow-xs' : 'border-[#1e293b]'
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b]">
                      <span className={`text-xs font-semibold ${isToday ? 'text-[#22c55e]' : 'text-slate-300'}`}>
                        {dayName}
                      </span>
                      <span className={`text-[11px] font-mono font-medium ${isToday ? 'px-1.5 rounded bg-[#16a34a] text-white' : 'text-slate-400'}`}>
                        {dayNum}
                      </span>
                    </div>

                    {/* Prominent 7:00 PM Slot Marker (Wireframe 3) */}
                    <div className="mt-2 py-1 px-1.5 rounded bg-[#111726] border border-[#1e293b] text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="font-mono text-[#22c55e] font-semibold">7:00 PM</span>
                      <span className="text-[9px] text-slate-500">Peak Window</span>
                    </div>

                    {/* Campaigns list on this day */}
                    <div className="mt-2 space-y-1.5">
                      {daysCampaigns.length === 0 ? (
                        <div className="py-4 text-center text-[10px] text-slate-600">
                          No messages
                        </div>
                      ) : (
                        daysCampaigns.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setPreviewCampaign(c)}
                            className="p-1.5 rounded bg-[#111726] border border-[#1e293b] hover:border-[#273549] text-left cursor-pointer transition space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400">
                                {formatTimeOnly(c.scheduledAt)}
                              </span>
                              {getStatusBadge(c.status)}
                            </div>
                            <div className="font-medium text-slate-200 text-[11px] truncate" title={c.title}>
                              {c.title}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Add on this day */}
                  <button
                    onClick={() => {
                      const d = new Date(date);
                      d.setHours(19, 0, 0, 0);
                      onOpenComposer({ scheduledAt: d.toISOString().slice(0, 16) });
                    }}
                    className="mt-2 w-full py-1 text-[10px] text-slate-400 hover:text-white rounded bg-[#162032] border border-[#273549] flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>7 PM Message</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
            <h3 className="text-xs font-semibold text-slate-200">
              Chronological Broadcast Agenda
            </h3>
            <span className="text-[11px] text-slate-500">
              Next scheduled dispatches in order
            </span>
          </div>

          <div className="space-y-2">
            {filteredCampaigns.slice(0, 10).map((camp) => (
              <div
                key={camp.id}
                className="p-3 rounded bg-[#090d16] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-[#162032] border border-[#273549] text-center font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 block uppercase">
                      {new Date(camp.scheduledAt).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      {new Date(camp.scheduledAt).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{camp.title}</span>
                      {getStatusBadge(camp.status)}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 max-w-xl truncate">
                      {camp.message.replace(/\*/g, '')}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                      <span>Time: <strong className="text-slate-400 font-mono">{formatTimeOnly(camp.scheduledAt)}</strong></span>
                      <span>Audience: <strong className="text-slate-400">{camp.targetSegmentId}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewCampaign(camp)}
                    className="px-2.5 py-1 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white transition text-[11px]"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onOpenComposer(camp)}
                    className="px-2.5 py-1 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white transition text-[11px]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LIVE WHATSAPP PREVIEW MODAL */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#1e293b] rounded-lg max-w-md w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-100">WhatsApp Broadcast Preview</h4>
                <p className="text-[10px] text-slate-400">{previewCampaign.title}</p>
              </div>
              <button onClick={() => setPreviewCampaign(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center bg-[#090d16] p-4 rounded border border-[#1e293b]">
              <WhatsAppChatPreview
                message={previewCampaign.message}
                mediaUrl={previewCampaign.mediaUrl}
                mediaType={previewCampaign.mediaType || 'none'}
                linkPreviewUrl={previewCampaign.linkPreviewUrl}
                timestamp={previewCampaign.scheduledAt}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Scheduled: {formatWhatsAppDate(previewCampaign.scheduledAt)}
              </span>
              <button
                onClick={() => setPreviewCampaign(null)}
                className="px-3 py-1 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
