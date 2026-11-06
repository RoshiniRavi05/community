'use client';

import React, { useState } from 'react';
import { 
  Save, 
  CheckCircle2,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  Lock,
  HelpCircle,
  BookOpen,
  MessageCircle,
  FileQuestion,
  LifeBuoy,
  ExternalLink,
  Stethoscope,
  ClipboardCheck,
  Phone,
  Mail,
  Headphones,
  Check
} from 'lucide-react';
import { AntiSpamSettings, AuditLog } from '@/lib/db/types';
import { formatWhatsAppDate } from '@/lib/utils';

interface SettingsViewProps {
  settings: AntiSpamSettings;
  auditLogs: AuditLog[];
  onUpdateSettings: (newSettings: Partial<AntiSpamSettings>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  auditLogs,
  onUpdateSettings
}) => {
  const [form, setForm] = useState<AntiSpamSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'support' | 'rules' | 'audit'>('support');

  const daysLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleDay = (dayIdx: number) => {
    let days = [...form.allowedSendDays];
    if (days.includes(dayIdx)) {
      days = days.filter(d => d !== dayIdx);
    } else {
      days.push(dayIdx);
    }
    setForm({ ...form, allowedSendDays: days });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateSettings(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── TOP SECTION TAB NAVIGATOR ── */}
      <div className="flex items-center gap-2 border-b border-[var(--border-card)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            activeTab === 'support'
              ? 'bg-[#263323] text-white shadow-xs'
              : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)]'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Help & Support Center</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-[#263323] text-white shadow-xs'
              : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Anti-Spam & Dispatch Safeguards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#263323] text-white shadow-xs'
              : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* ── TAB 1: HELP & SUPPORT CENTER (Warm cream theme) ── */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {/* Quick Help Header Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Frequently Asked Questions & Operations Guide
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">
                  Documentation and support resources for managing your WhatsApp Community broadcasts and automated dispatches.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#87936C]/20 text-[#87936C] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
              <div className="p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] space-y-1.5">
                <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold text-xs">
                  <BookOpen className="w-4 h-4 text-[#87936C]" />
                  <span>Scheduling Best Practices</span>
                </div>
                <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                  Always target quiet daytime hours (9:00 AM – 7:00 PM) to achieve maximum open rates and maintain Meta compliance.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] space-y-1.5">
                <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold text-xs">
                  <Shield className="w-4 h-4 text-[#87936C]" />
                  <span>Opt-Out Safeguards</span>
                </div>
                <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                  Recipients who text STOP, UNSUBSCRIBE, or CANCEL are suppressed automatically to maintain zero spam complaints.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] space-y-1.5">
                <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold text-xs">
                  <MessageCircle className="w-4 h-4 text-[#87936C]" />
                  <span>Contact Operations</span>
                </div>
                <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                  For WhatsApp Cloud API quota extensions or template re-evaluations, contact our technical team via the console.
                </p>
              </div>
            </div>
          </div>

          {/* Two-Tier Role-Based Access Control Guide Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-card)]">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Two-Tier Role Permissions Guide
                </h4>
                <p className="text-[11px] text-[var(--text-sub)] mt-0.5">
                  How role-based access control enforces compliance across broadcast reviews and dispatches.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--kpi-icon-bg)] text-[var(--kpi-icon-color)] border border-[var(--border-card)] font-semibold">
                RBAC Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Doctor Card */}
              <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[#87936C]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--kpi-icon-bg)] text-[var(--kpi-icon-color)] flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-main)]">Doctor (Approver)</h5>
                      <p className="text-[10px] text-[#27833A] font-medium font-mono">doctor@dwargasai.in</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--kpi-icon-bg)] text-[var(--kpi-icon-color)] border border-[var(--border-card)]">
                    Reviewer
                  </span>
                </div>
                <ul className="text-[11px] text-[var(--text-sub)] space-y-1 list-disc list-inside pt-1">
                  <li>Reviews all proposed medical & community messages</li>
                  <li>Has sole authority to click the green <strong className="text-[var(--text-main)]">Approve</strong> button</li>
                  <li>Clicking Approve unlocks the dispatch button for the Operations Manager</li>
                </ul>
              </div>

              {/* Manager Card */}
              <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-amber-300 dark:border-amber-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-main)]">Manager (Dispatcher)</h5>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium font-mono">manager@dwargasai.in</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Dispatcher
                  </span>
                </div>
                <ul className="text-[11px] text-[var(--text-sub)] space-y-1 list-disc list-inside pt-1">
                  <li>Composes broadcasts, configures recipients, and sets cadence schedules</li>
                  <li><strong className="text-[var(--text-main)]">Send Now is LOCKED</strong> with a lock icon until Doctor grants approval</li>
                  <li>Once Doctor approves, button turns active green to send message via WhatsApp</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed FAQs Accordion / Cards */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Common Questions
            </h4>

            <div className="space-y-2 text-xs">
              <details className="group p-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-app)] cursor-pointer">
                <summary className="font-semibold text-[var(--text-main)] flex items-center justify-between">
                  <span>How does the Emergency Kill-Switch work?</span>
                  <span className="text-[var(--text-sub)] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[11px] text-[var(--text-sub)] mt-2 leading-relaxed">
                  When the kill-switch is active, all automated background sweeps are halted immediately. No queued or scheduled message will be dispatched until you click "Resume Dispatches".
                </p>
              </details>

              <details className="group p-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-app)] cursor-pointer">
                <summary className="font-semibold text-[var(--text-main)] flex items-center justify-between">
                  <span>Can I export member lists and delivery records?</span>
                  <span className="text-[var(--text-sub)] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[11px] text-[var(--text-sub)] mt-2 leading-relaxed">
                  Yes, you can export full CSV datasets from both the Members view and the Analytics view. These exports include timestamps, delivery rates, read rates, and member status.
                </p>
              </details>

              <details className="group p-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-app)] cursor-pointer">
                <summary className="font-semibold text-[var(--text-main)] flex items-center justify-between">
                  <span>What happens during quiet hours?</span>
                  <span className="text-[var(--text-sub)] group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-[11px] text-[var(--text-sub)] mt-2 leading-relaxed">
                  Broadcasts scheduled between the quiet hours start and end time (default 21:00 to 08:00) are deferred until the quiet hours window concludes to respect member preferences.
                </p>
              </details>
            </div>
          </div>

          {/* Support Desk Contact Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#87936C]" />
                  <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                    Dwaragasai Technical & Operations Desk
                  </h4>
                </div>
                <p className="text-[11px] text-[var(--text-sub)]">
                  Need assistance with WhatsApp templates, webhook diagnostics, or role configuration?
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a
                  href="mailto:support@dwargasai.in"
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] hover:border-[#87936C] text-[var(--text-main)] font-medium flex items-center gap-1.5 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-[#87936C]" />
                  <span>support@dwargasai.in</span>
                </a>
                <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-sub)] font-mono text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#87936C]" />
                  <span>+91 (080) 4123-5678</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ANTI-SPAM SETTINGS FORM ── */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSave} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
            <div>
              <h2 className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">
                Anti-Spam Parameters & Dispatch Limits
              </h2>
              <p className="text-[11px] text-[var(--text-sub)] mt-0.5">
                Evaluated at runtime immediately before each recipient message dispatch
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#87936C] hover:bg-[#77835c] text-white text-xs font-medium shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-lg bg-[#E7EBD8] border border-[#87936C]/40 text-xs text-[#27833A] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#27833A]" />
              <span>Settings successfully saved and actively enforced by background dispatcher.</span>
            </div>
          )}

          {/* Section 1: Rate Limits */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold text-[var(--text-main)] uppercase tracking-wider">
              Recipient Frequency Caps
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] space-y-1.5">
                <label className="text-[var(--text-main)] font-medium block text-[11px]">Max Promotional / Day</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.maxPromotionalPerDay}
                  onChange={(e) => setForm({ ...form, maxPromotionalPerDay: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md px-2.5 py-1 text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[#87936C]"
                />
                <span className="text-[10px] text-[var(--text-sub)] block">Default: 1 broadcast per recipient</span>
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] space-y-1.5">
                <label className="text-[var(--text-main)] font-medium block text-[11px]">Max Promotional / Week</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={form.maxPromotionalPerWeek}
                  onChange={(e) => setForm({ ...form, maxPromotionalPerWeek: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md px-2.5 py-1 text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[#87936C]"
                />
                <span className="text-[10px] text-[var(--text-sub)] block">Default: 2 broadcasts per recipient</span>
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-card)] space-y-1.5">
                <label className="text-[var(--text-main)] font-medium block text-[11px]">Minimum Interval (Hours)</label>
                <input
                  type="number"
                  min={12}
                  max={168}
                  value={form.minIntervalHours}
                  onChange={(e) => setForm({ ...form, minIntervalHours: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md px-2.5 py-1 text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[#87936C]"
                />
                <span className="text-[10px] text-[var(--text-sub)] block">Default: 48 hours between promotions</span>
              </div>
            </div>
          </div>

          {/* Section 2: Quiet Hours */}
          <div className="space-y-2.5 pt-3 border-t border-[var(--border-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-semibold text-[var(--text-main)] uppercase tracking-wider">
                  Protected Quiet Hours
                </h3>
                <p className="text-[10px] text-[var(--text-sub)]">
                  Defers broadcasts scheduled at night to prevent unwanted alerts
                </p>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={form.quietHoursEnabled}
                  onChange={(e) => setForm({ ...form, quietHoursEnabled: e.target.checked })}
                  className="rounded border-[var(--border-card)] text-[#87936C] focus:ring-0"
                />
                <span className="font-semibold text-[var(--text-main)]">Quiet Hours Enabled</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs max-w-sm">
              <div>
                <label className="text-[var(--text-sub)] block mb-1 text-[11px]">Start Time</label>
                <input
                  type="time"
                  value={form.quietHoursStart}
                  onChange={(e) => setForm({ ...form, quietHoursStart: e.target.value })}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] rounded-md px-2.5 py-1 text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[#87936C]"
                />
              </div>

              <div>
                <label className="text-[var(--text-sub)] block mb-1 text-[11px]">End Time</label>
                <input
                  type="time"
                  value={form.quietHoursEnd}
                  onChange={(e) => setForm({ ...form, quietHoursEnd: e.target.value })}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] rounded-md px-2.5 py-1 text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[#87936C]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Allowed Sending Days */}
          <div className="space-y-2 pt-3 border-t border-[var(--border-card)]">
            <h3 className="text-[11px] font-semibold text-[var(--text-main)] uppercase tracking-wider">
              Permitted Promotional Days
            </h3>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {daysLabels.map((day, idx) => {
                const isSelected = form.allowedSendDays.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-1 rounded-md text-xs transition font-medium ${
                      isSelected
                        ? 'bg-[#87936C] text-white shadow-xs'
                        : 'bg-[var(--bg-app)] text-[var(--text-sub)] border border-[var(--border-card)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Suppression Keywords */}
          <div className="space-y-2 pt-3 border-t border-[var(--border-card)]">
            <h3 className="text-[11px] font-semibold text-[var(--text-main)] uppercase tracking-wider">
              Automatic Opt-Out Suppression Keywords
            </h3>
            <p className="text-[11px] text-[var(--text-sub)]">
              Inbound WhatsApp replies matching these words immediately place the recipient on the suppression list.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs font-mono">
              {form.optOutKeywords.map((kw, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#E7EBD8] border border-[#87936C]/30 text-[#27833A] font-semibold">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 3: AUDIT TRAIL ── */}
      {activeTab === 'audit' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-[var(--border-card)] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-main)]">
              Administrative Audit Trail ({auditLogs.length} events)
            </h3>
            <span className="text-[10px] text-[var(--text-sub)] font-mono">Immutable audit records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-card)] bg-[var(--bg-app)] text-[10px] text-[var(--text-sub)] font-semibold uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]/50 text-[11px] text-[var(--text-main)]">
                {auditLogs.slice(0, 20).map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-[var(--text-sub)] font-mono">{formatWhatsAppDate(log.timestamp)}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-[var(--text-main)]">{log.adminUser}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#27833A] font-medium">{log.action}</td>
                    <td className="py-2.5 px-3 text-[var(--text-sub)]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
