'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  ShieldAlert, 
  Send,
  Repeat,
  Clock
} from 'lucide-react';
import { Campaign, AudienceSegment, Member, AntiSpamSettings, CampaignCategory, RecurrenceCadence } from '@/lib/db/types';
import { WhatsAppChatPreview } from '../preview/WhatsAppChatPreview';
import { validateMessageAgainstAntiSpam } from '@/lib/scheduler/antispam';

interface CampaignComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: Partial<Campaign>) => Promise<void>;
  initialData?: Partial<Campaign>;
  segments: AudienceSegment[];
  members: Member[];
  settings: AntiSpamSettings;
}

const TEMPLATES: Record<CampaignCategory, { label: string; text: string; mediaType: 'image' | 'video' | 'none'; sampleMedia?: string }> = {
  announcement: {
    label: 'Community Announcement',
    text: "*Community Briefing: Key Updates for This Week*\n\nHighlights, schedule modifications, and workshops are now published.\n\nRead the complete schedule: https://example.com/announcements\n\nReply STOP to opt out of updates.",
    mediaType: 'none'
  },
  camp_event: {
    label: 'Camp & Workshop',
    text: "*Winter Hands-on Camp 2026: Registration Open*\n\nRegistrations are officially open for our week-long intensive workshop (Ages 9-15).\n\nDates: Nov 14 – Nov 20\nVenue: Innovation Hub, Bangalore\nPerk: 20% discount with code CAMPCOMM20\n\nRegister: https://example.com/camps\n\nLimited to 30 participants. Reply STOP to opt out.",
    mediaType: 'image',
    sampleMedia: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80'
  },
  event_reminder: {
    label: 'Event Reminder',
    text: "*Reminder: Tomorrow's Masterclass*\n\nOur interactive session starts tomorrow at 6:00 PM IST.\n\nRoom link: https://zoom.us/j/community123\nPasscode: COMMUNITY\n\nPlease join 5 minutes early.",
    mediaType: 'none'
  },
  reel_video: {
    label: 'Video Release',
    text: "*New Video Resource for the Community*\n\nWatch our walkthrough on building AI agents with TypeScript:\n\nLink: https://www.instagram.com/reel/DA123456789/\n\nReply STOP to opt out of notifications.",
    mediaType: 'image',
    sampleMedia: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  },
  discount_offer: {
    label: 'Discount & Perk',
    text: "*Exclusive Community Flash Offer*\n\nEnjoy 25% off on upcoming bootcamp passes this weekend.\n\nCode: COMMUNITY25\nValid until Sunday midnight.\n\nClaim here: https://example.com/perks\n\nReply STOP to opt out.",
    mediaType: 'image',
    sampleMedia: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
  },
  registration_deadline: {
    label: 'Registration Deadline',
    text: "*Final Notice: Registration Closes Today*\n\nThis is the last call to secure a seat for this weekend's session.\n\nLink: https://example.com/register\n\nReply STOP to opt out.",
    mediaType: 'none'
  },
  general_update: {
    label: 'General Notice',
    text: "*Community Tip: Channel Organization*\n\nYou can organize your community channels by topic tabs. Read our quick documentation here: https://example.com/guide\n\nReply STOP to opt out.",
    mediaType: 'none'
  }
};

export const CampaignComposerModal: React.FC<CampaignComposerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  segments,
  members,
  settings
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<CampaignCategory>(initialData?.category || 'announcement');
  const [message, setMessage] = useState(initialData?.message || TEMPLATES.announcement.text);
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | 'none'>(initialData?.mediaType || 'none');
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(initialData?.linkPreviewUrl || '');
  const [targetSegmentId, setTargetSegmentId] = useState(initialData?.targetSegmentId || 'seg_all');
  
  const getInitialDateTime = () => {
    if (initialData?.scheduledAt) {
      const d = new Date(initialData.scheduledAt);
      return d.toISOString().slice(0, 16);
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [scheduledAt, setScheduledAt] = useState(getInitialDateTime());
  const [timezone, setTimezone] = useState(initialData?.timezone || 'Asia/Kolkata');
  const [requiresApproval, setRequiresApproval] = useState(initialData?.requiresApproval ?? true);
  const [internalNotes, setInternalNotes] = useState(initialData?.internalNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cadence / Repetitive Scheduling State
  const [cadence, setCadence] = useState<RecurrenceCadence>(initialData?.cadence || 'none');
  const [cadenceIntervalDays, setCadenceIntervalDays] = useState<number>(initialData?.cadenceIntervalDays || 1);
  const [cadenceOccurrences, setCadenceOccurrences] = useState<number>(initialData?.cadenceOccurrences || 5);

  const handleCadenceSelect = (newCadence: RecurrenceCadence) => {
    setCadence(newCadence);
    if (newCadence === 'daily') {
      setCadenceIntervalDays(1);
      setCadenceOccurrences(7);
    } else if (newCadence === 'every_3_days') {
      setCadenceIntervalDays(3);
      setCadenceOccurrences(5);
    } else if (newCadence === 'every_5_days') {
      setCadenceIntervalDays(5);
      setCadenceOccurrences(5);
    } else if (newCadence === 'weekly') {
      setCadenceIntervalDays(7);
      setCadenceOccurrences(4);
    } else if (newCadence === 'custom_days') {
      setCadenceIntervalDays(2);
      setCadenceOccurrences(5);
    }
  };

  const getProjectedDates = () => {
    if (cadence === 'none') return [];
    const base = new Date(scheduledAt || Date.now()).getTime();
    if (isNaN(base)) return [];
    const dates: Date[] = [];
    const count = Math.min(8, Math.max(2, cadenceOccurrences));
    const interval = cadence === 'daily' ? 1 
      : cadence === 'every_3_days' ? 3 
      : cadence === 'every_5_days' ? 5 
      : cadence === 'weekly' ? 7 
      : Math.max(1, cadenceIntervalDays);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(base + (i * interval * 24 * 3600 * 1000)));
    }
    return dates;
  };

  if (!isOpen) return null;

  const targetMembers = members.filter(m => {
    if (targetSegmentId === 'all' || targetSegmentId === 'seg_all') return true;
    const seg = segments.find(s => s.id === targetSegmentId);
    if (!seg) return true;
    if (seg.filters.consentOnly && m.consentStatus !== 'opted_in') return false;
    if (seg.filters.interests && seg.filters.interests.length > 0) {
      return m.interests.some(i => seg.filters.interests!.includes(i));
    }
    return true;
  });

  const mockCampaign: Campaign = {
    id: 'mock_test',
    title: title || 'Test',
    message,
    category,
    mediaUrl,
    mediaType,
    targetSegmentId,
    scheduledAt: new Date(scheduledAt).toISOString(),
    timezone,
    status: 'scheduled',
    requiresApproval,
    totalRecipients: targetMembers.length,
    sentCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    blockedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const eligibleCount = targetMembers.filter(m => {
    const val = validateMessageAgainstAntiSpam(m, mockCampaign, [], settings, new Date(scheduledAt));
    return val.allowed;
  }).length;

  const blockedOptOut = targetMembers.filter(m => m.isUnsubscribed || m.consentStatus !== 'opted_in').length;
  const blockedFrequency = targetMembers.length - eligibleCount - blockedOptOut;

  const handleApplyTemplate = (cat: CampaignCategory) => {
    setCategory(cat);
    const tmpl = TEMPLATES[cat];
    setMessage(tmpl.text);
    setMediaType(tmpl.mediaType);
    if (tmpl.sampleMedia) {
      setMediaUrl(tmpl.sampleMedia);
    } else {
      setMediaUrl('');
    }
    if (!title) {
      setTitle(tmpl.label);
    }
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!title.trim()) {
      alert('Please enter a campaign name');
      return;
    }
    if (!message.trim()) {
      alert('Please enter message text');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        category,
        message,
        mediaUrl: mediaUrl || undefined,
        mediaType,
        linkPreviewUrl: linkPreviewUrl || undefined,
        targetSegmentId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        timezone,
        status: saveAsDraft ? 'draft' : requiresApproval ? 'pending_approval' : 'scheduled',
        requiresApproval,
        internalNotes,
        cadence,
        cadenceIntervalDays: cadence === 'daily' ? 1 : cadence === 'every_3_days' ? 3 : cadence === 'every_5_days' ? 5 : cadence === 'weekly' ? 7 : cadenceIntervalDays,
        cadenceOccurrences: cadence !== 'none' ? cadenceOccurrences : 1
      });
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#101726] border border-[#1b2537] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1b2537] flex items-center justify-between bg-[#0c121e]/80">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Campaign Composer & Message Scheduler
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Plan and validate upcoming WhatsApp community broadcasts</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a253a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body grid: Form on left, WhatsApp live preview on right */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Quick Templates Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Standard templates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TEMPLATES) as CampaignCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleApplyTemplate(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                      category === cat
                        ? 'bg-[#c2f83a] text-black border-[#c2f83a] shadow-[0_0_8px_rgba(194,248,58,0.4)]'
                        : 'bg-[#141c2c] text-slate-300 border-[#1e2a3c] hover:bg-[#1f2b40]'
                    }`}
                  >
                    {TEMPLATES[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Winter Robotics Camp Registration Open"
                className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#c2f83a]/60"
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">WhatsApp Message Content *</label>
                <span className="text-[10px] text-slate-500">
                  Formatting: *bold*, _italics_
                </span>
              </div>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your WhatsApp message..."
                className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-[#c2f83a]/60 leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                <span>{message.length} characters</span>
                <span>Include opt-out notice (e.g. Reply STOP to unsubscribe)</span>
              </div>
            </div>

            {/* Media Attachment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attachment Type</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'document' | 'none')}
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
                >
                  <option value="none">Text Only (No Attachment)</option>
                  <option value="image">Image (PNG, JPG)</option>
                  <option value="video">Video (MP4)</option>
                  <option value="document">Document (PDF)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Media URL</label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={mediaType === 'none'}
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c2f83a]/60 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Target Segment & Schedule Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audience Segment</label>
                <select
                  value={targetSegmentId}
                  onChange={(e) => setTargetSegmentId(e.target.value)}
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
                >
                  <option value="seg_all">All Opted-in Members ({members.filter(m => m.consentStatus === 'opted_in').length})</option>
                  {segments.filter(s => s.id !== 'seg_all').map(s => (
                    <option key={s.id} value={s.id}>{s.name} (~{s.memberCount})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Time *</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>
            </div>

            {/* Repetitive / Cadence Scheduling Section */}
            <div className="p-3.5 rounded-xl bg-[#0c121e] border border-[#1b2537] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className={`w-4 h-4 ${cadence !== 'none' ? 'text-[#c2f83a]' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white tracking-tight">Repetitive Message Cadence</span>
                </div>
                {cadence !== 'none' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30 font-semibold">
                    {cadence === 'daily' ? 'Repeats Daily' : cadence === 'every_3_days' ? 'Every 3 Days' : cadence === 'every_5_days' ? 'Every 5 Days' : cadence === 'weekly' ? 'Weekly' : `Every ${cadenceIntervalDays} Days`}
                  </span>
                )}
              </div>

              {/* Cadence Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                {[
                  { id: 'none', label: 'One-off', icon: '1x' },
                  { id: 'daily', label: 'Daily', icon: '⚡' },
                  { id: 'every_3_days', label: '3 Days Once', icon: '🔁' },
                  { id: 'every_5_days', label: '5 Days Once', icon: '🚀' },
                  { id: 'weekly', label: 'Weekly', icon: '📅' },
                  { id: 'custom_days', label: 'Custom', icon: '⏱️' }
                ].map((item) => {
                  const isActive = cadence === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCadenceSelect(item.id as RecurrenceCadence)}
                      className={`px-2 py-2 rounded-xl text-center transition flex flex-col items-center gap-0.5 border ${
                        isActive
                          ? 'bg-[#182738] border-[#c2f83a] text-[#c2f83a] shadow-[0_0_10px_rgba(194,248,58,0.2)] font-bold'
                          : 'bg-[#141c2c] border-[#1e2a3c] text-slate-400 hover:text-white hover:bg-[#1a253a]'
                      }`}
                    >
                      <span className="text-xs">{item.icon}</span>
                      <span className="text-[10px] leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cadence Settings & Projected Dates Preview */}
              {cadence !== 'none' && (
                <div className="space-y-2.5 pt-2 border-t border-[#1b2537]">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {cadence === 'custom_days' && (
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Repeat Every (Days)</label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={cadenceIntervalDays}
                          onChange={(e) => setCadenceIntervalDays(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#c2f83a]/60"
                        />
                      </div>
                    )}
                    <div className={cadence === 'custom_days' ? '' : 'col-span-2'}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold">Total Occurrences to Schedule</label>
                        <span className="font-mono text-[#c2f83a] font-bold">{cadenceOccurrences} messages</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="2"
                          max="15"
                          value={cadenceOccurrences}
                          onChange={(e) => setCadenceOccurrences(Number(e.target.value))}
                          className="w-full accent-[#c2f83a] cursor-pointer"
                        />
                        <span className="text-[11px] font-mono text-slate-400 w-8 text-right">{cadenceOccurrences}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Projected Occurrence Dates */}
                  <div className="bg-[#101726] border border-[#1b2537] rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#c2f83a]" />
                        Projected Dispatch Timeline:
                      </span>
                      <span className="text-[10px] font-mono">Showing next {getProjectedDates().length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getProjectedDates().map((d, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-[#141c2c] border border-[#1e2a3c] text-[10px] font-mono text-slate-300 flex items-center gap-1.5"
                        >
                          <span className="w-4 h-4 rounded-full bg-[#c2f83a]/20 text-[#c2f83a] text-[9px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                          <span className="text-slate-500">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Anti-Spam Safety Check */}
            <div className="p-3.5 rounded-xl bg-[#0c121e] border border-[#1b2537] space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#c2f83a] border-[#1e2a3c]"
                />
                <span className="font-semibold">Require administrative review before dispatch</span>
              </label>

              <div className="pt-2 border-t border-[#1b2537] flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Frequency limit check:</span>
                <span className="font-mono text-[#c2f83a]">
                  {eligibleCount} eligible · {blockedOptOut > 0 ? `${blockedOptOut} opted-out · ` : ''}{blockedFrequency > 0 ? `${blockedFrequency} capped` : ''}
                </span>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Internal Notes (Optional)</label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="e.g. Approved by lead"
                className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c2f83a]/60"
              />
            </div>
          </div>

          {/* Right Column: Live Mobile WhatsApp Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#0c121e] rounded-2xl p-4 border border-[#1b2537]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Delivery Preview
            </div>

            <WhatsAppChatPreview
              message={message}
              mediaUrl={mediaType !== 'none' ? mediaUrl : undefined}
              mediaType={mediaType}
              linkPreviewUrl={linkPreviewUrl || (message.match(/https?:\/\/[^\s]+/)?.[0])}
              timestamp={scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()}
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-[#1b2537] flex items-center justify-between bg-[#0c121e]/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#141c2c] hover:bg-[#1f2b40] text-slate-200 border border-[#1e2a3c] transition"
            >
              Save draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#c2f83a] hover:bg-[#b0e82e] text-black transition flex items-center gap-2 shadow-[0_0_15px_rgba(194,248,58,0.3)] disabled:opacity-50 active:scale-95"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{requiresApproval ? 'Submit for review' : 'Schedule message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
