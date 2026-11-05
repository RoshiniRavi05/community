'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  ShieldAlert, 
  Send,
  Repeat,
  Clock,
  ExternalLink,
  Tent,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Stethoscope,
  ClipboardCheck
} from 'lucide-react';
import { Campaign, AudienceSegment, Member, AntiSpamSettings, CampaignCategory, RecurrenceCadence, AuthUser } from '@/lib/db/types';
import { WhatsAppChatPreview } from '../preview/WhatsAppChatPreview';
import { isWithinQuietHours, isAllowedDay } from '@/lib/scheduler/antispam';

interface CampaignComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: Partial<Campaign>) => Promise<void>;
  initialData?: Partial<Campaign>;
  segments: AudienceSegment[];
  members: Member[];
  settings: AntiSpamSettings;
  currentUser?: AuthUser | null;
}

const TEMPLATES: Record<CampaignCategory, { label: string; text: string; mediaType: 'image' | 'video' | 'none'; sampleMedia?: string }> = {
  announcement: {
    label: 'Community Briefing',
    text: "*Community Briefing: Key Updates for This Week*\n\nHighlights, schedule modifications, and workshops are now published.\n\nRead the complete schedule: https://example.com/announcements\n\nReply STOP to opt out of updates.",
    mediaType: 'none'
  },
  camp_event: {
    label: 'Camp Announcement',
    text: "*Free Blood Test & Health Screening Camp: Tiruppur*\n\nComprehensive blood diagnostic, diabetic screening, and vitals checkup for community residents.\n\nDates: Nov 6 – Nov 8, 2026\nVenue: Tiruppur Central Community Hall, Kumaran Road\nTarget: All Community & Seniors\n\nRegistration: https://example.com/camps/tiruppur\n\nReply STOP to opt out.",
    mediaType: 'image',
    sampleMedia: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80'
  },
  event_reminder: {
    label: 'Event Reminder',
    text: "*Reminder: Upcoming Health & Tech Camp*\n\nOur interactive session starts tomorrow at 7:00 PM IST.\n\nVenue: Community Outreach Hub\n\nPlease arrive 10 minutes early. Reply STOP to opt out.",
    mediaType: 'none'
  },
  reel_video: {
    label: 'Social Reel Release',
    text: "*New Health & Care Reel for our Community*\n\nWatch our new practical guide on daily elder care and nutrition:\n\nLink: https://www.instagram.com/reel/sample123/\n\nReply STOP to opt out of notifications.",
    mediaType: 'image',
    sampleMedia: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  },
  discount_offer: {
    label: 'Camp Discount Perk',
    text: "*Community Perk: 20% Health Workshop Waiver*\n\nExclusive concession voucher for Tiruppur community members.\n\nCode: TIRUPPUR20\n\nClaim here: https://example.com/perks\n\nReply STOP to opt out.",
    mediaType: 'none'
  },
  registration_deadline: {
    label: 'Registration Deadline',
    text: "*Final Notice: Camp Registration Closes Today at 7:00 PM*\n\nThis is the last call to secure a slot for this week's diagnostic camp.\n\nLink: https://example.com/register\n\nReply STOP to opt out.",
    mediaType: 'none'
  },
  general_update: {
    label: 'General Notice',
    text: "*Community Tip: WhatsApp Channel Updates*\n\nPlease add our official desk to your contacts to ensure timely delivery of community alerts.\n\nReply STOP to opt out.",
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
  settings,
  currentUser
}) => {
  const isManager = currentUser?.role === 'manager';
  const isDoctor = currentUser?.role === 'doctor';

  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<CampaignCategory>(initialData?.category || 'announcement');
  const [message, setMessage] = useState(initialData?.message || TEMPLATES.announcement.text);
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | 'none'>(initialData?.mediaType || 'none');
  const [linkPreviewUrl, setLinkPreviewUrl] = useState(initialData?.linkPreviewUrl || '');
  const [targetSegmentId, setTargetSegmentId] = useState(initialData?.targetSegmentId || 'seg_all');
  const [selectedCamp, setSelectedCamp] = useState('All Camps');

  // Default to 7:00 PM as specified in wireframe 3
  const getInitialDateTime = () => {
    if (initialData?.scheduledAt) {
      const d = new Date(initialData.scheduledAt);
      return d.toISOString().slice(0, 16);
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0); // 7:00 PM as drawn in wireframe
    return d.toISOString().slice(0, 16);
  };

  const [scheduledAt, setScheduledAt] = useState(getInitialDateTime());
  const [timezone, setTimezone] = useState(initialData?.timezone || 'Asia/Kolkata');
  // Managers ALWAYS require Doctor approval
  const [requiresApproval, setRequiresApproval] = useState(isManager ? true : (initialData?.requiresApproval ?? false));
  const [internalNotes, setInternalNotes] = useState(initialData?.internalNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cadence / Repetitive Scheduling State
  const [cadence, setCadence] = useState<RecurrenceCadence>(initialData?.cadence || 'none');
  const [cadenceIntervalDays, setCadenceIntervalDays] = useState<number>(initialData?.cadenceIntervalDays || 1);
  const [cadenceOccurrences, setCadenceOccurrences] = useState<number>(initialData?.cadenceOccurrences || 5);
  // Local ISO string helper (avoids UTC timezone shift)
  const toLocalISOString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDisplayDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return iso;
    }
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Little Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calViewDate, setCalViewDate] = useState(() => {
    return initialData?.scheduledAt ? new Date(initialData.scheduledAt) : new Date(Date.now() + 86400000);
  });

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
    }
  };

  // Set time to 7:00 PM preset
  const set7PMTime = () => {
    const d = new Date(scheduledAt || Date.now());
    d.setHours(19, 0, 0, 0);
    setScheduledAt(toLocalISOString(d));
  };

  // Anti-Spam validation check
  const [validationResult, setValidationResult] = useState<any>(null);
  useEffect(() => {
    const scheduledDateObj = scheduledAt ? new Date(scheduledAt) : new Date();
    const inQuiet = isWithinQuietHours(settings, scheduledDateObj);
    const dayAllowed = isAllowedDay(settings, scheduledDateObj);
    setValidationResult({
      inQuietHours: inQuiet,
      disallowedDay: !dayAllowed
    });
  }, [scheduledAt, category, message, members.length, settings]);

  const handleScheduleClick = () => {
    if (!title.trim()) {
      alert('Campaign Title is required before scheduling.');
      return;
    }
    if (!message.trim()) {
      alert('Message Content cannot be empty.');
      return;
    }
    // Sync calendar view month to currently scheduled date
    const d = new Date(scheduledAt || Date.now());
    if (!isNaN(d.getTime())) {
      setCalViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setShowCalendarModal(true);
  };

  const handleApplyTemplate = (cat: CampaignCategory) => {
    setCategory(cat);
    const tmpl = TEMPLATES[cat];
    setMessage(tmpl.text);
    setMediaType(tmpl.mediaType);
    if (tmpl.sampleMedia) setMediaUrl(tmpl.sampleMedia);
  };

  const handleSubmit = async (isDraft: boolean = false, sendImmediately: boolean = false) => {
    if (!title.trim()) {
      alert('Campaign Title is required');
      return;
    }
    if (!message.trim()) {
      alert('Message Content cannot be empty');
      return;
    }

    if (sendImmediately && isManager) {
      alert('Action Restricted: Broadcasts require Doctor approval before sending. Please submit for Doctor review.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalStatus = initialData?.status || 'scheduled';
      let finalScheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();

      if (sendImmediately) {
        finalStatus = 'processing';
        finalScheduledAt = new Date().toISOString();
      } else if (isDraft) {
        finalStatus = 'draft';
      } else if (isManager || requiresApproval) {
        finalStatus = 'pending_approval';
      }

      await onSave({
        ...initialData,
        title: title.trim(),
        message: message.trim(),
        category,
        mediaUrl: mediaType !== 'none' ? mediaUrl.trim() : undefined,
        mediaType,
        linkPreviewUrl: linkPreviewUrl.trim() || undefined,
        targetSegmentId,
        scheduledAt: finalScheduledAt,
        timezone,
        status: finalStatus,
        requiresApproval: isManager ? true : (sendImmediately ? false : requiresApproval),
        isDoctorApproved: isDoctor ? true : false,
        internalNotes: `${internalNotes} ${selectedCamp !== 'All Camps' ? `[Camp: ${selectedCamp}]` : ''}`.trim(),
        cadence,
        cadenceIntervalDays: cadence !== 'none' ? cadenceIntervalDays : 1,
        cadenceOccurrences: cadence !== 'none' ? cadenceOccurrences : 1
      });
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#111726] border border-[#1e293b] rounded-lg w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#0d121f]">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Message Composer & Scheduler</span>
              {isManager && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800">
                  Manager Mode • Doctor Approval Enforced
                </span>
              )}
              {isDoctor && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  Doctor Authority Mode
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Create, validate against anti-spam policies, and schedule community dispatches
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body grid: Form on left, WhatsApp live preview on right */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 space-y-3.5 text-xs">
            {/* Quick Templates Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Standard Category Template
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TEMPLATES) as CampaignCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleApplyTemplate(cat)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                      category === cat
                        ? 'bg-[#16a34a] text-white border-[#16a34a]'
                        : 'bg-[#162032] text-slate-300 border-[#273549] hover:bg-[#1e2c45]'
                    }`}
                  >
                    {TEMPLATES[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Message Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tiruppur Health Camp Announcement"
                className="w-full px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
              />
            </div>

            {/* Message Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Message Content *
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {message.length} chars • *bold*, _italics_ supported
                </span>
              </div>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs font-mono focus:outline-none focus:border-[#16a34a]"
              />
            </div>

            {/* Audience Selection */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Select Audience
                </label>
                <select
                  value={targetSegmentId}
                  onChange={(e) => setTargetSegmentId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-200 text-xs focus:outline-none focus:border-[#16a34a]"
                >
                  <option value="seg_all">All Community (Consent Opted-In)</option>
                  <option value="seg_parents">Parents & Youth Camp Leads</option>
                  <option value="seg_tech">STEM & Coding Enthusiasts</option>
                  <option value="seg_elderly">Elderly & Senior Care Members</option>
                  <option value="seg_tiruppur">Tiruppur District Residents</option>
                </select>
              </div>
            </div>

            {/* Media Upload & Link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Media Attachment
                </label>
                <div className="flex gap-2">
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-24 px-2 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-200 text-xs focus:outline-none focus:border-[#16a34a]"
                  >
                    <option value="none">None</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  {mediaType !== 'none' && (
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Image / Video URL"
                      className="flex-1 px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Add Link Preview (Optional)
                </label>
                <input
                  type="text"
                  value={linkPreviewUrl}
                  onChange={(e) => setLinkPreviewUrl(e.target.value)}
                  placeholder="https://example.com/camps"
                  className="w-full px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
                />
              </div>
            </div>

            {/* Scheduling Controls: Date, Time (with 7:00 PM preset!), Timezone */}
            <div className="p-3 rounded bg-[#090d16] border border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>Scheduled Date & Time</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScheduleClick}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#16a34a]/20 text-[#22c55e] border border-[#16a34a]/40 hover:bg-[#16a34a]/30 transition font-medium flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Open Calendar</span>
                  </button>
                  <button
                    type="button"
                    onClick={set7PMTime}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#162032] text-slate-300 border border-[#273549] hover:bg-[#1e2c45] transition font-mono font-medium"
                  >
                    7:00 PM Default
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleScheduleClick}
                  className="w-full px-2.5 py-1.5 rounded bg-[#111726] border border-[#1e293b] hover:border-[#16a34a] text-slate-100 text-xs font-mono text-left flex items-center justify-between transition group"
                >
                  <span className="truncate">{formatDisplayDateTime(scheduledAt)}</span>
                  <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#22c55e] shrink-0 ml-1" />
                </button>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-[#111726] border border-[#1e293b] text-slate-200 text-xs focus:outline-none focus:border-[#16a34a]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC (Universal Time)</option>
                </select>
              </div>
            </div>

            {/* Daily / Recurrence Options */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Recurrence:</span>
                {(['none', 'daily', 'every_3_days', 'weekly'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCadenceSelect(c)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize transition ${
                      cadence === c
                        ? 'bg-[#16a34a] text-white border-[#16a34a]'
                        : 'bg-[#162032] text-slate-400 border-[#273549] hover:text-slate-200'
                    }`}
                  >
                    {c === 'none' ? 'Once' : c.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isManager}
                  checked={isManager ? true : requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded bg-[#090d16] border-[#1e293b] text-[#16a34a] focus:ring-0 disabled:opacity-75"
                />
                <span>Requires Doctor Approval {isManager && '(Mandatory for Manager)'}</span>
              </label>
            </div>
          </div>

          {/* Right Column: Live Mobile WhatsApp Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#090d16] rounded-md p-4 border border-[#1e293b]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              WhatsApp Message Preview
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
        <div className="px-5 py-3 border-t border-[#1e293b] flex items-center justify-between bg-[#0d121f]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                if (!message.trim()) {
                  alert('Please enter a message before launching WhatsApp.');
                  return;
                }
                const encoded = encodeURIComponent(message);
                navigator.clipboard.writeText(message);
                window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
              }}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#162032] hover:bg-[#1e2c45] border border-[#273549] text-slate-300 transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch in WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true, false)}
              className="px-3.5 py-1.5 rounded text-xs font-medium bg-[#162032] hover:bg-[#1e2c45] text-slate-300 border border-[#273549] transition"
            >
              Save Draft
            </button>

            {/* SEND NOW: Disabled for Manager, Enabled for Doctor */}
            {isManager ? (
              <button
                type="button"
                disabled
                title="LOCKED: Messages must be reviewed & approved by the Doctor (doctor@dwargasai.in) before sending. Please click 'Submit for Doctor Review'."
                className="px-3.5 py-1.5 rounded text-xs font-medium bg-[#162032] border border-[#273549] text-slate-500 transition flex items-center gap-1.5 cursor-not-allowed opacity-60"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Send Now (Locked)</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false, true)}
                className="px-3.5 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Now</span>
              </button>
            )}

            {/* Main Scheduling / Submission Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleScheduleClick}
              className="px-4 py-1.5 rounded text-xs font-medium bg-[#16a34a] hover:bg-[#15803d] text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isManager ? 'Submit for Doctor Review' : (requiresApproval ? 'Submit for Review' : 'Schedule Message')}</span>
            </button>
          </div>
        </div>

        {/* Little Calendar Picker Popup */}
        {showCalendarModal && (() => {
          const calYear = calViewDate.getFullYear();
          const calMonth = calViewDate.getMonth();
          const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

          const currentScheduledDate = scheduledAt ? new Date(scheduledAt) : new Date();

          return (
            <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-[#111726] border border-[#1e293b] rounded-xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#22c55e]" />
                    <span className="text-xs font-semibold text-slate-100">
                      Select Dispatch Date & Time
                    </span>
                  </div>
                  <button onClick={() => setShowCalendarModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setCalViewDate(new Date(calYear, calMonth - 1, 1))}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#162032]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-200">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalViewDate(new Date(calYear, calMonth + 1, 1))}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#162032]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-medium">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="py-0.5">{d}</div>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {/* Empty cells before 1st day */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-1.5 text-transparent">.</div>
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const thisDate = new Date(calYear, calMonth, dayNum);
                    const isSelected = 
                      currentScheduledDate.getDate() === dayNum &&
                      currentScheduledDate.getMonth() === calMonth &&
                      currentScheduledDate.getFullYear() === calYear;
                    const isToday = new Date().toDateString() === thisDate.toDateString();

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => {
                          const nextDate = new Date(scheduledAt || Date.now());
                          nextDate.setFullYear(calYear, calMonth, dayNum);
                          setScheduledAt(toLocalISOString(nextDate));
                        }}
                        className={`py-1.5 rounded text-xs font-mono transition ${
                          isSelected
                            ? 'bg-[#16a34a] text-white font-bold shadow-xs'
                            : isToday
                            ? 'border border-[#22c55e] text-[#22c55e] hover:bg-[#162032]'
                            : 'text-slate-200 hover:bg-[#162032]'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                {/* Time Picker Controls with Quick Presets */}
                <div className="pt-2 border-t border-[#1e293b] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-medium">Dispatch Time:</span>
                    <input
                      type="time"
                      value={scheduledAt ? scheduledAt.slice(11, 16) : '19:00'}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':');
                        const d = new Date(scheduledAt || Date.now());
                        d.setHours(Number(h) || 19, Number(m) || 0, 0, 0);
                        setScheduledAt(toLocalISOString(d));
                      }}
                      className="px-2 py-1 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs font-mono focus:outline-none focus:border-[#16a34a]"
                    />
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    {[
                      { label: '9:00 AM', h: 9, m: 0 },
                      { label: '1:00 PM', h: 13, m: 0 },
                      { label: '5:00 PM', h: 17, m: 0 },
                      { label: '7:00 PM', h: 19, m: 0 }
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          const d = new Date(scheduledAt || Date.now());
                          d.setHours(p.h, p.m, 0, 0);
                          setScheduledAt(toLocalISOString(d));
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                          scheduledAt && Number(scheduledAt.slice(11, 13)) === p.h && Number(scheduledAt.slice(14, 16)) === p.m
                            ? 'bg-[#16a34a] text-white border-[#16a34a]'
                            : 'bg-[#162032] text-slate-300 border-[#273549] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduled Summary Badge */}
                <div className="p-2.5 rounded bg-[#162032]/80 border border-[#273549] text-[11px] text-slate-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                  <div className="truncate">
                    <span>Scheduled: </span>
                    <strong className="text-white">{formatDisplayDateTime(scheduledAt)}</strong>
                  </div>
                </div>

                {/* Anti-spam caution if in quiet hours */}
                {validationResult?.inQuietHours && (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-800 text-amber-300 text-[10px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Falls inside quiet hours (9:00 PM - 8:00 AM). Delivery may be delayed.</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="px-4 py-3 border-t border-[#1e293b] flex items-center justify-end gap-2 bg-[#0d121f]">
                  <button
                    type="button"
                    onClick={() => setShowCalendarModal(false)}
                    className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setShowCalendarModal(false);
                      await handleSubmit(false, false);
                    }}
                    className="px-3.5 py-1.5 rounded text-xs font-medium bg-[#16a34a] hover:bg-[#15803d] text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Confirm & Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
