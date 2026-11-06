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
  Ban,
  Lock,
  Stethoscope,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { Campaign, AudienceSegment, Member, CampaignStatus, RecurrenceCadence, AuthUser } from '@/lib/db/types';
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
  currentUser?: AuthUser | null;
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
  defaultView = 'table',
  currentUser
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'weekly_calendar' | 'monthly_calendar' | 'agenda'>(defaultView);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [monthOffset, setMonthOffset] = useState(0);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const isDoctor = currentUser?.role === 'doctor';
  const isManager = currentUser?.role === 'manager';

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
  const getStatusBadge = (camp: Campaign | CampaignStatus, compact = false) => {
    const status = typeof camp === 'string' ? camp : camp.status;
    const isDoctorApproved = typeof camp === 'object' ? Boolean(camp.isDoctorApproved) : false;

    const sizeClasses = compact
      ? 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold'
      : 'inline-flex items-center justify-center gap-1.5 min-w-[124px] h-6 px-2.5 rounded-full text-[11px] font-semibold';

    if (status === 'completed') {
      return (
        <span className={`${sizeClasses} bg-[#E7EBD8] dark:bg-[#1E271C] text-[#2D3328] dark:text-[#BAC9A9] border border-[#87936C]/40`}>
          <Check className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-[#556947] dark:text-[#87936C] shrink-0`} />
          <span>Delivered</span>
        </span>
      );
    }

    if (status === 'cancelled') {
      return (
        <span className={`${sizeClasses} bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700`}>
          <span>Cancelled</span>
        </span>
      );
    }

    if (status === 'processing') {
      return (
        <span className={`${sizeClasses} bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800`}>
          <span>Processing</span>
        </span>
      );
    }

    if (status === 'failed' || status === 'partially_failed') {
      return (
        <span className={`${sizeClasses} bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800`}>
          <span>Failed</span>
        </span>
      );
    }

    // Pending Approval or unapproved scheduled state
    if (status === 'pending_approval' || (status === 'scheduled' && !isDoctorApproved)) {
      return (
        <span className={`${sizeClasses} bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs`}>
          <Clock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-600 dark:text-amber-400 shrink-0`} />
          <span>Awaiting Doctor</span>
        </span>
      );
    }

    // Scheduled & Doctor Approved
    if (status === 'scheduled' && isDoctorApproved) {
      return (
        <span className={`${sizeClasses} bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs`}>
          <CheckCircle2 className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-emerald-600 dark:text-emerald-400 shrink-0`} />
          <span>Doctor Approved</span>
        </span>
      );
    }

    return (
      <span className={`${sizeClasses} bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700`}>
        <span>Draft</span>
      </span>
    );
  };

  // Bulk selection toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredCampaigns.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkCancel = async () => {
    if (!confirm(`Cancel ${selectedIds.size} selected campaigns?`)) return;
    setIsDeleting(true);
    for (const id of Array.from(selectedIds)) {
      await onCancelCampaign(id);
    }
    setSelectedIds(new Set());
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* ── ROLE-BASED ACCESS CONTROL BANNER ── */}
      {currentUser && (
        <div className="p-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between gap-3 text-xs shadow-xs transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--kpi-icon-bg)] text-[var(--kpi-icon-color)] flex items-center justify-center shrink-0">
              {isDoctor ? <Stethoscope className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
            </div>
            <span className="font-semibold text-xs text-[var(--text-main)]">
              {isDoctor ? 'Doctor Review Portal (Approver)' : 'Manager Dispatch Portal (Operations)'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 font-medium">
            <span className="px-2.5 py-1 rounded-full bg-[var(--kpi-icon-bg)] border border-[var(--border-card)] text-[11px] font-medium text-[var(--kpi-icon-color)]">
              {isDoctor ? 'Approval Authority: ACTIVE' : 'Send Now: Gated by Doctor'}
            </span>
          </div>
        </div>
      )}

      {/* 1. TOP CONTROLS & VIEW SWITCHER */}
      <div className="bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns, audience..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-card)] text-xs text-[var(--text-main)] placeholder-[var(--text-sub)] focus:outline-none focus:ring-1 focus:ring-[#87936C]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-card)] text-xs text-[var(--text-main)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="processing">Processing</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkCancel}
              disabled={isDeleting}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Cancel ({selectedIds.size})</span>
            </button>
          )}

          {/* View Switchers: Schedule / History, Calendar, Agenda */}
          <div className="inline-flex rounded-md bg-[var(--bg-app)] p-0.5 border border-[var(--border-card)] text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-[#87936C] hover:bg-[#77835c] text-white font-medium'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Schedule Table</span>
            </button>

            <button
              onClick={() => setViewMode('weekly_calendar')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                viewMode === 'weekly_calendar'
                  ? 'bg-[#87936C] hover:bg-[#77835c] text-white font-medium'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Weekly Calendar</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-[#87936C] hover:bg-[#77835c] text-white font-medium'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          {/* + Add Message */}
          <button
            onClick={() => onOpenComposer()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#87936C] hover:bg-[#77835c] text-white text-xs font-medium shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Message</span>
          </button>
        </div>
      </div>

      {/* 2. TABLE VIEW (Default) */}
      {viewMode === 'table' && (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--bg-app)] border-b border-[var(--border-card)] text-[var(--text-sub)] font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.size > 0 && selectedIds.size === filteredCampaigns.length}
                      className="rounded border-[var(--border-card)] text-[#87936C] focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-3">Broadcast Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Dispatch Schedule</th>
                  <th className="py-2.5 px-3">Target Audience</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--text-sub)]">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-[var(--text-sub)] opacity-40" />
                      <p>No broadcast campaigns found matching the filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => {
                    const isSelected = selectedIds.has(camp.id);
                    const isCampDoctorApproved = Boolean(camp.isDoctorApproved);

                    return (
                      <tr
                        key={camp.id}
                        className={`hover:bg-[var(--bg-app)]/50 transition ${
                          isSelected ? 'bg-[var(--bg-app)]' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(camp.id)}
                            className="rounded border-[var(--border-card)] text-[#87936C] focus:ring-0"
                          />
                        </td>

                        {/* Title & Preview snippet */}
                        <td className="py-2.5 px-3 max-w-[280px]">
                          <div className="font-semibold text-[var(--text-main)] truncate" title={camp.title}>
                            {camp.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-sub)] truncate max-w-xs">
                            {camp.message.replace(/\*/g, '')}
                          </div>
                          {camp.cadence && camp.cadence !== 'none' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                              <Repeat className="w-2.5 h-2.5" />
                              Cadence: {camp.cadence} ({camp.seriesIndex || 1}/{camp.cadenceOccurrences || 1})
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 text-[var(--text-sub)] whitespace-nowrap text-[11px]">
                          {camp.category.replace('_', ' ')}
                        </td>

                        {/* Schedule Time */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono text-[var(--text-main)]">
                          {formatWhatsAppDate(camp.scheduledAt)}
                        </td>

                        {/* Audience */}
                        <td className="py-2.5 px-3 text-[var(--text-main)] whitespace-nowrap text-[11px]">
                          {camp.targetSegmentId === 'seg_all' ? 'All Community' : camp.targetSegmentId}
                        </td>

                        {/* Status with Doctor Approval indicator */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(camp)}
                        </td>

                        {/* Actions with Role Enforcement */}
                        <td className="py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Slot for Role Primary Action Button (Fixed 100px width for alignment) */}
                            <div className="w-[100px] flex justify-end shrink-0">
                              {/* 1. DOCTOR ROLE ACTION */}
                              {isDoctor && (
                                (camp.status === 'pending_approval' || (camp.status === 'scheduled' && !isCampDoctorApproved)) ? (
                                  <button
                                    onClick={() => onApproveCampaign(camp.id)}
                                    title="Doctor Authority: Approve this broadcast for dispatch"
                                    className="w-full h-7 rounded-md bg-[#27833A] hover:bg-[#1f682e] text-white text-[11px] font-semibold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Approve</span>
                                  </button>
                                ) : (camp.status === 'scheduled' && isCampDoctorApproved) ? (
                                  <span
                                    title={`Approved by ${camp.approvedBy || 'Doctor'}`}
                                    className="w-full h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-[11px] font-semibold flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Approved</span>
                                  </span>
                                ) : null
                              )}

                              {/* 2. MANAGER ROLE ACTION */}
                              {isManager && (
                                (camp.status === 'pending_approval' || camp.status === 'scheduled' || camp.status === 'draft') ? (
                                  isCampDoctorApproved ? (
                                    <button
                                      onClick={() => onSendNow(camp.id)}
                                      title="Doctor Approved: Click to dispatch now"
                                      className="w-full h-7 rounded-md bg-[#87936C] hover:bg-[#77835c] text-white text-[11px] font-semibold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5 shrink-0" />
                                      <span>Send Now</span>
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      title="LOCKED: Requires Doctor approval (doctor@dwargasai.in) before Send Now is enabled"
                                      className="w-full h-7 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-[11px] font-medium transition cursor-not-allowed flex items-center justify-center gap-1 border border-stone-200 dark:border-stone-700"
                                    >
                                      <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span>Send Now</span>
                                    </button>
                                  )
                                ) : null
                              )}

                              {/* Fallback if user role is not logged in / default view */}
                              {!isDoctor && !isManager && (
                                camp.status === 'pending_approval' ? (
                                  <button
                                    onClick={() => onApproveCampaign(camp.id)}
                                    title="Approve Campaign"
                                    className="w-full h-7 rounded-md bg-[#27833A] hover:bg-[#1f682e] text-white text-[11px] font-semibold transition shadow-xs flex items-center justify-center gap-1"
                                  >
                                    Approve
                                  </button>
                                ) : (camp.status === 'scheduled' || camp.status === 'draft') ? (
                                  <button
                                    onClick={() => onSendNow(camp.id)}
                                    title="Dispatch Message Now"
                                    className="w-full h-7 rounded-md bg-[#87936C] hover:bg-[#77835c] text-white text-[11px] font-semibold transition shadow-xs flex items-center justify-center gap-1"
                                  >
                                    Send Now
                                  </button>
                                ) : null
                              )}
                            </div>

                            {/* Common Utility Icons (Fixed width slot: 4 icons × 24px) */}
                            <div className="flex items-center justify-end gap-0.5 text-[var(--text-sub)] shrink-0">
                              <button
                                onClick={() => setPreviewCampaign(camp)}
                                title="Live WhatsApp Preview"
                                className="w-6 h-6 rounded flex items-center justify-center hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onOpenComposer(camp)}
                                title="Edit / Reschedule"
                                className="w-6 h-6 rounded flex items-center justify-center hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDuplicateCampaign(camp.id)}
                                title="Duplicate for Next Week"
                                className="w-6 h-6 rounded flex items-center justify-center hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {camp.status !== 'completed' && camp.status !== 'cancelled' ? (
                                <button
                                  onClick={() => onCancelCampaign(camp.id)}
                                  title="Cancel Campaign"
                                  className="w-6 h-6 rounded flex items-center justify-center hover:text-rose-400 hover:bg-rose-950/20 transition"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="w-6 h-6 inline-block" />
                              )}
                            </div>
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

      {/* 3. WEEKLY CALENDAR VIEW */}
      {viewMode === 'weekly_calendar' && (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-card)] p-4 space-y-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-sub)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[var(--text-main)]">
                {formatDateRange()}
              </span>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-1 rounded hover:bg-[var(--bg-muted)] text-[var(--text-sub)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-sub)] hover:text-white"
                >
                  This Week
                </button>
              )}
            </div>

            <span className="text-[11px] text-[var(--text-sub)] font-mono">
              7 Days Broadcast Roadmap
            </span>
          </div>

          {/* 7 Columns for Monday to Sunday */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((date, idx) => {
              const dayCampaigns = getCampaignsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-2.5 min-h-[160px] flex flex-col justify-between ${
                    isToday
                      ? 'border-[#87936C] bg-[var(--bg-app)]'
                      : 'border-[var(--border-card)] bg-[var(--bg-card)]'
                  }`}
                >
                  <div>
                    {/* Header: Day and Date */}
                    <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-1 mb-2">
                      <span className="text-[11px] font-semibold text-[var(--text-main)]">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isToday ? 'bg-[#87936C] text-white font-bold' : 'text-[var(--text-sub)]'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Campaigns list for this day */}
                    <div className="space-y-1.5">
                      {dayCampaigns.length === 0 ? (
                        <p className="text-[10px] text-[var(--text-sub)] text-center py-4 opacity-50 italic">
                          No messages
                        </p>
                      ) : (
                        dayCampaigns.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setPreviewCampaign(c)}
                            className="p-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-left cursor-pointer hover:border-[#87936C] transition space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-[var(--text-sub)]">
                                {formatTimeOnly(c.scheduledAt)}
                              </span>
                              {getStatusBadge(c, true)}
                            </div>
                            <div className="font-medium text-[var(--text-main)] text-[11px] truncate" title={c.title}>
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
                    className="mt-2 w-full py-1 text-[10px] text-[var(--text-sub)] hover:text-white rounded bg-[var(--bg-muted)] border border-[var(--border-card)] flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-card)] p-4 space-y-3">
          <h3 className="text-xs font-semibold text-[var(--text-main)] border-b border-[var(--border-card)] pb-2">
            Chronological Upcoming Broadcast Agenda
          </h3>
          <div className="divide-y divide-[var(--border-card)]">
            {campaigns.slice(0, 10).map((camp) => (
              <div key={camp.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-center">
                    <span className="block text-[10px] uppercase font-bold text-[#87936C]">
                      {new Date(camp.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="block text-base font-bold text-[var(--text-main)] font-mono">
                      {new Date(camp.scheduledAt).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-main)]">{camp.title}</span>
                      {getStatusBadge(camp)}
                    </div>
                    <p className="text-[var(--text-sub)] text-[11px] mt-0.5 max-w-xl truncate">
                      {camp.message.replace(/\*/g, '')}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-sub)] mt-1">
                      <span>Time: <strong className="text-[var(--text-sub)] font-mono">{formatTimeOnly(camp.scheduledAt)}</strong></span>
                      <span>Audience: <strong className="text-[var(--text-sub)]">{camp.targetSegmentId}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewCampaign(camp)}
                    className="px-2.5 py-1 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-[11px]"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onOpenComposer(camp)}
                    className="px-2.5 py-1 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-[11px]"
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
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-md w-full p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-2">
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-main)]">WhatsApp Broadcast Preview</h4>
                <p className="text-[10px] text-[var(--text-sub)]">{previewCampaign.title}</p>
              </div>
              <button onClick={() => setPreviewCampaign(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center bg-[var(--bg-app)] p-4 rounded border border-[var(--border-card)]">
              <WhatsAppChatPreview
                message={previewCampaign.message}
                mediaUrl={previewCampaign.mediaUrl}
                mediaType={previewCampaign.mediaType || 'none'}
                linkPreviewUrl={previewCampaign.linkPreviewUrl}
                timestamp={previewCampaign.scheduledAt}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-[10px] text-[var(--text-sub)] font-mono">
                Scheduled: {formatWhatsAppDate(previewCampaign.scheduledAt)}
              </span>
              <button
                onClick={() => setPreviewCampaign(null)}
                className="px-3 py-1 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white"
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
