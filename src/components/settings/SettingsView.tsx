'use client';

import React, { useState } from 'react';
import { 
  Save, 
  CheckCircle2,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  Lock
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
    <div className="space-y-4">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-[#111726] border border-[#1e293b] rounded-md p-4 space-y-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Anti-Spam Parameters & Dispatch Limits
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Evaluated at runtime immediately before each recipient message dispatch
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Settings successfully saved and actively enforced by background dispatcher.</span>
          </div>
        )}

        {/* Section 1: Rate Limits */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Recipient Frequency Caps
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-[#090d16] border border-[#1e293b] space-y-1">
              <label className="text-slate-300 font-medium block text-[11px]">Max Promotional / Day</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.maxPromotionalPerDay}
                onChange={(e) => setForm({ ...form, maxPromotionalPerDay: Number(e.target.value) })}
                className="w-full bg-[#111726] border border-[#1e293b] rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#16a34a]"
              />
              <span className="text-[10px] text-slate-500 block">Default: 1 broadcast per recipient</span>
            </div>

            <div className="p-3 rounded bg-[#090d16] border border-[#1e293b] space-y-1">
              <label className="text-slate-300 font-medium block text-[11px]">Max Promotional / Week</label>
              <input
                type="number"
                min={1}
                max={7}
                value={form.maxPromotionalPerWeek}
                onChange={(e) => setForm({ ...form, maxPromotionalPerWeek: Number(e.target.value) })}
                className="w-full bg-[#111726] border border-[#1e293b] rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#16a34a]"
              />
              <span className="text-[10px] text-slate-500 block">Default: 2 broadcasts per recipient</span>
            </div>

            <div className="p-3 rounded bg-[#090d16] border border-[#1e293b] space-y-1">
              <label className="text-slate-300 font-medium block text-[11px]">Minimum Interval (Hours)</label>
              <input
                type="number"
                min={12}
                max={168}
                value={form.minIntervalHours}
                onChange={(e) => setForm({ ...form, minIntervalHours: Number(e.target.value) })}
                className="w-full bg-[#111726] border border-[#1e293b] rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#16a34a]"
              />
              <span className="text-[10px] text-slate-500 block">Default: 48 hours between promotions</span>
            </div>
          </div>
        </div>

        {/* Section 2: Quiet Hours */}
        <div className="space-y-2.5 pt-3 border-t border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Protected Quiet Hours
              </h3>
              <p className="text-[10px] text-slate-400">
                Defers broadcasts scheduled at night to prevent unwanted alerts
              </p>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.quietHoursEnabled}
                onChange={(e) => setForm({ ...form, quietHoursEnabled: e.target.checked })}
                className="rounded bg-[#090d16] border-[#1e293b] text-[#16a34a] focus:ring-0"
              />
              <span className="font-semibold text-white">Quiet Hours Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs max-w-sm">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Start Time</label>
              <input
                type="time"
                value={form.quietHoursStart}
                onChange={(e) => setForm({ ...form, quietHoursStart: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#16a34a]"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">End Time</label>
              <input
                type="time"
                value={form.quietHoursEnd}
                onChange={(e) => setForm({ ...form, quietHoursEnd: e.target.value })}
                className="w-full bg-[#090d16] border border-[#1e293b] rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#16a34a]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Allowed Sending Days */}
        <div className="space-y-2 pt-3 border-t border-[#1e293b]">
          <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
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
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    isSelected
                      ? 'bg-[#16a34a] text-white font-medium'
                      : 'bg-[#090d16] text-slate-400 border border-[#1e293b] hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Suppression Keywords */}
        <div className="space-y-2 pt-3 border-t border-[#1e293b]">
          <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Automatic Opt-Out Suppression Keywords
          </h3>
          <p className="text-[11px] text-slate-400">
            Inbound WhatsApp replies matching these words immediately place the recipient on the suppression list.
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {form.optOutKeywords.map((kw, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-[#090d16] border border-[#1e293b] text-[#22c55e] font-semibold">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </form>

      {/* Audit Log Table */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between bg-[#0d121f]">
          <h3 className="text-xs font-semibold text-slate-200">
            Administrative Audit Trail ({auditLogs.length} events)
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Immutable audit records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#090d16] text-[10px] text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50 font-mono text-[11px] text-slate-300">
              {auditLogs.slice(0, 20).map(log => (
                <tr key={log.id} className="hover:bg-[#151c2c] transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap text-slate-400">{formatWhatsAppDate(log.timestamp)}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-white font-sans font-medium">{log.adminUser}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-[#22c55e]">{log.action}</td>
                  <td className="py-2 px-3 text-slate-400 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
