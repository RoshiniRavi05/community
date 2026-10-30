'use client';

import React, { useState } from 'react';
import { 
  Save, 
  CheckCircle2
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
      <form onSubmit={handleSave} className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 shadow-lg space-y-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2537]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Anti-Spam & Frequency Rules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated at runtime immediately before each recipient message dispatch
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 text-xs font-semibold transition shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-[#162725] border border-[#c2f83a]/30 text-xs text-[#c2f83a] flex items-center gap-2.5 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-[#c2f83a]" />
            <span>Settings saved and actively enforced in background scheduler.</span>
          </div>
        )}

        {/* Section 1: Rate Limits */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Recipient Frequency Caps
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141c2c] border border-[#223049] space-y-1.5">
              <label className="text-slate-300 font-medium block">Max promotional / day</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.maxPromotionalPerDay}
                onChange={(e) => setForm({ ...form, maxPromotionalPerDay: Number(e.target.value) })}
                className="w-full bg-[#0e1420] border border-[#223049] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]"
              />
              <span className="text-[10px] text-slate-400 block">Default: 1 broadcast per recipient</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141c2c] border border-[#223049] space-y-1.5">
              <label className="text-slate-300 font-medium block">Max promotional / week</label>
              <input
                type="number"
                min={1}
                max={7}
                value={form.maxPromotionalPerWeek}
                onChange={(e) => setForm({ ...form, maxPromotionalPerWeek: Number(e.target.value) })}
                className="w-full bg-[#0e1420] border border-[#223049] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]"
              />
              <span className="text-[10px] text-slate-400 block">Default: 2 broadcasts per recipient</span>
            </div>

            <div className="p-4 rounded-xl bg-[#141c2c] border border-[#223049] space-y-1.5">
              <label className="text-slate-300 font-medium block">Minimum interval (hours)</label>
              <input
                type="number"
                min={12}
                max={168}
                value={form.minIntervalHours}
                onChange={(e) => setForm({ ...form, minIntervalHours: Number(e.target.value) })}
                className="w-full bg-[#0e1420] border border-[#223049] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]"
              />
              <span className="text-[10px] text-slate-400 block">Default: 48 hours between promotions</span>
            </div>
          </div>
        </div>

        {/* Section 2: Quiet Hours */}
        <div className="space-y-3 pt-4 border-t border-[#1b2537]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Protected Quiet Hours
              </h3>
              <p className="text-xs text-slate-400">
                Defers broadcasts scheduled at night to prevent community complaints
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.quietHoursEnabled}
                onChange={(e) => setForm({ ...form, quietHoursEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#c2f83a] border-[#223049] focus:ring-0 bg-[#141c2c]"
              />
              <span className="font-semibold text-white">Enabled</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs max-w-sm">
            <div>
              <label className="text-slate-400 block mb-1">Start time</label>
              <input
                type="time"
                value={form.quietHoursStart}
                onChange={(e) => setForm({ ...form, quietHoursStart: e.target.value })}
                className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">End time</label>
              <input
                type="time"
                value={form.quietHoursEnd}
                onChange={(e) => setForm({ ...form, quietHoursEnd: e.target.value })}
                className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Allowed Sending Days */}
        <div className="space-y-3 pt-4 border-t border-[#1b2537]">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Permitted Promotional Days
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {daysLabels.map((day, idx) => {
              const isSelected = form.allowedSendDays.includes(idx);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                    isSelected
                      ? 'bg-[#c2f83a] text-slate-950 border-[#c2f83a] font-semibold shadow-xs'
                      : 'bg-[#141c2c] text-slate-400 border-[#223049] hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Suppression Keywords */}
        <div className="space-y-3 pt-4 border-t border-[#1b2537]">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Automatic Opt-Out Suppression Keywords
          </h3>
          <p className="text-xs text-slate-400">
            Inbound WhatsApp replies matching these words immediately place the recipient on the suppression list.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {form.optOutKeywords.map((kw, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-[#141c2c] border border-[#223049] text-[#c2f83a] font-semibold">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </form>

      {/* Audit Log Table */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1b2537] flex items-center justify-between bg-[#0e1420]">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Administrative Audit Trail ({auditLogs.length} events)
          </h3>
          <span className="text-xs text-slate-400">Immutable security logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0e1420] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2537]/50 font-mono text-[11px] text-slate-300">
              {auditLogs.slice(0, 20).map(log => (
                <tr key={log.id} className="hover:bg-[#161f30] transition-colors">
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-400">{formatWhatsAppDate(log.timestamp)}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap text-white font-sans font-semibold">{log.adminUser}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-200">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
