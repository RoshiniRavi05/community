'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Bell, 
  BellRing, 
  Check, 
  Plus, 
  Pencil, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Users, 
  Heart, 
  Utensils, 
  Pill, 
  Activity, 
  Droplet,
  Smartphone,
  Eye,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { CareAlarm, AlarmType, Member } from '@/lib/db/types';
import { WhatsAppChatPreview } from '../preview/WhatsAppChatPreview';

interface CareAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarms: CareAlarm[];
  members: Member[];
  onToggleAlarm: (alarmId: string) => Promise<void>;
  onSaveAlarm: (alarmData: Partial<CareAlarm>) => Promise<void>;
  onDeleteAlarm: (alarmId: string) => Promise<void>;
  onTriggerAlarmNow: (alarmId: string) => Promise<void>;
}

const ALARM_TYPE_CONFIG: Record<AlarmType, { label: string; icon: any; color: string; defaultTemplate: string }> = {
  medicine: {
    label: 'Medicine / Prescription',
    icon: Pill,
    color: '#38bdf8',
    defaultTemplate: "🌅 *Gentle Care Reminder: Morning Medicine*\n\nGood morning! Please take your prescribed medicine with warm water after a light meal.\n\n_Stay hydrated and take care of your health today!_"
  },
  meal_diet: {
    label: 'Meal / Diet Reminder',
    icon: Utensils,
    color: '#c2f83a',
    defaultTemplate: "🥗 *Care Reminder: Nutritious Meal Time*\n\nIt is time for your wholesome meal and a glass of water. Remember to take any post-meal supplements or digestion aids if prescribed.\n\n_Rest peacefully for 20 minutes after eating._"
  },
  vitals_check: {
    label: 'Vitals & BP Check',
    icon: Activity,
    color: '#f43f5e',
    defaultTemplate: "🩺 *Wellness Check: Vitals & Blood Pressure*\n\nFriendly reminder to check your blood pressure or blood sugar readings if due today, and take a brief relaxing stroll.\n\n_Keep up your healthy routine!_"
  },
  hydration: {
    label: 'Hydration & Water Alarm',
    icon: Droplet,
    color: '#06b6d4',
    defaultTemplate: "💧 *Hydration Care Alarm*\n\nTime to sip a full glass of fresh water or warm herbal tea. Proper hydration keeps your body energized and joints relaxed!"
  },
  custom: {
    label: 'Custom Routine Care',
    icon: Clock,
    color: '#a855f7',
    defaultTemplate: "🔔 *Daily Care Routine Reminder*\n\nGentle reminder from your care community to follow your scheduled routine today. Wishing you peace and good health!"
  }
};

export const CareAlarmModal: React.FC<CareAlarmModalProps> = ({
  isOpen,
  onClose,
  alarms,
  members,
  onToggleAlarm,
  onSaveAlarm,
  onDeleteAlarm,
  onTriggerAlarmNow
}) => {
  // Live clock display
  const [currentTime, setCurrentTime] = useState<string>('');
  const [editingAlarm, setEditingAlarm] = useState<Partial<CareAlarm> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [previewAlarm, setPreviewAlarm] = useState<CareAlarm | null>(null);
  const [expandedRecipientsAlarmId, setExpandedRecipientsAlarmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active_only' | 'medicine' | 'meal_diet'>('all');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  // Compute matched elderly members for a specific minimum age
  const getElderlyMembers = (minAge: number) => {
    return members.filter(m => {
      const age = m.age || (m.ageRange === '50+' ? 60 : 0);
      return age >= minAge && m.consentStatus === 'opted_in' && !m.isUnsubscribed;
    });
  };

  const activeAlarmsCount = alarms.filter(a => a.isActive).length;

  const handleCreateNew = () => {
    setEditingAlarm({
      title: 'Morning Medicine & Breakfast Alarm',
      alarmType: 'medicine',
      time: '08:00',
      label: 'Morning Dose & Warm Meal',
      customMessage: ALARM_TYPE_CONFIG.medicine.defaultTemplate,
      isActive: true,
      targetAgeMin: 50,
      targetAudienceLabel: 'Elderly Members (50+ yrs)',
      repeatDays: ['Daily'],
      audioTone: 'gentle_chime'
    });
    setIsAddingNew(true);
  };

  const handleEdit = (alarm: CareAlarm) => {
    setEditingAlarm({ ...alarm });
    setIsAddingNew(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlarm) return;
    setIsProcessing(true);
    try {
      await onSaveAlarm(editingAlarm);
      setEditingAlarm(null);
      setIsAddingNew(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving alarm');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerTest = async (alarm: CareAlarm) => {
    setIsProcessing(true);
    try {
      await onTriggerAlarmNow(alarm.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error ringing alarm');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAlarms = alarms.filter(a => {
    if (activeFilter === 'active_only') return a.isActive;
    if (activeFilter === 'medicine') return a.alarmType === 'medicine';
    if (activeFilter === 'meal_diet') return a.alarmType === 'meal_diet';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f1523] border border-[#1b2537] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header with Digital Clock Display */}
        <div className="px-6 py-4 border-b border-[#1b2537] flex flex-wrap items-center justify-between gap-4 bg-[#0a0f1a]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30 flex items-center justify-center shadow-[0_0_15px_rgba(194,248,58,0.2)]">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Elderly Care & Medicine Alarm Clock
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30">
                  {activeAlarmsCount} Active Alarms
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Clock-style reminders to take medicine, eat meals, and stay hydrated — stays active daily until switched OFF
              </p>
            </div>
          </div>

          {/* Right: Live Digital Clock & Close */}
          <div className="flex items-center gap-3">
            <div className="bg-[#141c2c] border border-[#1e2a3c] rounded-2xl px-3.5 py-1.5 flex items-center gap-2 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-[#c2f83a]" />
              <div className="text-xs font-mono font-extrabold text-white tracking-wider">
                {currentTime || '08:00:00 AM'}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">IST</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1a253a] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-header Filter Toolbar */}
        <div className="px-6 py-2.5 bg-[#0a0f1a]/50 border-b border-[#1b2537] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter:</span>
            {[
              { id: 'all', label: `All Alarms (${alarms.length})` },
              { id: 'active_only', label: `Active (${activeAlarmsCount})` },
              { id: 'medicine', label: 'Medicine Only' },
              { id: 'meal_diet', label: 'Meal & Diet Only' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  activeFilter === tab.id
                    ? 'bg-[#182738] text-[#c2f83a] border border-[#c2f83a]/50 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#141c2c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold transition shadow-[0_0_10px_rgba(194,248,58,0.25)]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set New Alarm</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Explanation Callout */}
          <div className="p-3.5 rounded-2xl bg-[#141d2e] border border-[#1f2b42] flex items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#c2f83a] shrink-0" />
              <span>
                <strong>Persistent Alarm Rule:</strong> Alarms run automatically every single day at the set clock time. They will <strong>only turn off when you explicitly click OFF</strong>. Notifications are filtered age-wise specifically to elderly and senior members.
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#c2f83a] px-2 py-0.5 rounded-md bg-[#c2f83a]/15 border border-[#c2f83a]/30 shrink-0">
              Age-Wise Elderly Filter
            </span>
          </div>

          {/* Alarms Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlarms.map(alarm => {
              const cfg = ALARM_TYPE_CONFIG[alarm.alarmType] || ALARM_TYPE_CONFIG.medicine;
              const IconComp = cfg.icon;
              const elderlyList = getElderlyMembers(alarm.targetAgeMin);
              const isRecipientsExpanded = expandedRecipientsAlarmId === alarm.id;

              return (
                <div
                  key={alarm.id}
                  className={`rounded-2xl border transition p-5 flex flex-col justify-between space-y-4 shadow-xl ${
                    alarm.isActive
                      ? 'bg-[#121826] border-[#1f2c42] hover:border-[#2b3e5a]'
                      : 'bg-[#0c111c] border-[#182130] opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Digital Alarm Time + Toggle Switch (ON/OFF) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center border"
                          style={{ 
                            backgroundColor: `${cfg.color}15`, 
                            borderColor: `${cfg.color}35`,
                            color: cfg.color 
                          }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-2xl font-mono font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
                            <span>{alarm.time}</span>
                            <span className="text-xs font-semibold text-slate-400">
                              {Number(alarm.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {alarm.label}
                          </div>
                        </div>
                      </div>

                      {/* CLOCK ALARM TOGGLE SWITCH (ON / OFF) */}
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleAlarm(alarm.id)}
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                            alarm.isActive
                              ? 'bg-[#c2f83a] border-[#c2f83a]'
                              : 'bg-[#1a2436] border-[#25344d]'
                          }`}
                          title={alarm.isActive ? 'Alarm is ON (Click to turn OFF)' : 'Alarm is OFF (Click to turn ON)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                              alarm.isActive ? 'translate-x-7' : 'translate-x-0 bg-slate-400'
                            }`}
                          />
                        </button>
                        <span className={`text-[9px] font-mono font-extrabold uppercase tracking-wider ${
                          alarm.isActive ? 'text-[#c2f83a]' : 'text-slate-500'
                        }`}>
                          {alarm.isActive ? '● ALARM ON' : '○ TURNED OFF'}
                        </span>
                      </div>
                    </div>

                    {/* Alarm Title & Elderly Audience Target */}
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {alarm.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-[#182738] border border-[#23354c] text-slate-300 flex items-center gap-1 font-mono text-[11px]">
                          <Users className="w-3 h-3 text-[#c2f83a]" />
                          Age {alarm.targetAgeMin}+ Elderly ({elderlyList.length} members)
                        </span>

                        <span className="px-2 py-0.5 rounded-lg bg-[#141c2c] border border-[#1e2a3c] text-slate-400 text-[11px]">
                          Repeats: Daily
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          {alarm.totalDeliveredCount || 0} delivered
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Custom Message Box */}
                    <div className="p-3 rounded-xl bg-[#090d16] border border-[#192234] text-xs font-mono text-slate-300 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans">
                        <span>Custom Reminder Message:</span>
                        <button
                          onClick={() => setPreviewAlarm(alarm)}
                          className="text-[#c2f83a] hover:underline flex items-center gap-1"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>Simulate WhatsApp</span>
                        </button>
                      </div>
                      <div className="whitespace-pre-line text-[11px] leading-relaxed line-clamp-3">
                        {alarm.customMessage}
                      </div>
                    </div>

                    {/* Collapsible Elderly Members List */}
                    {isRecipientsExpanded && (
                      <div className="p-3 rounded-xl bg-[#090d16] border border-[#1e2a3c] space-y-2 text-xs">
                        <div className="font-semibold text-slate-300 flex items-center justify-between text-[11px]">
                          <span>Elderly Community Recipients (Age {alarm.targetAgeMin}+):</span>
                          <span className="text-slate-500 font-mono">{elderlyList.length} total</span>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {elderlyList.map(m => (
                            <div key={m.id} className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#121826] text-[11px]">
                              <span className="text-white font-medium">{m.name}</span>
                              <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                                <span>Age {m.age}</span>
                                <span>•</span>
                                <span>{m.phone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-[#1b2537] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedRecipientsAlarmId(isRecipientsExpanded ? null : alarm.id)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{isRecipientsExpanded ? 'Hide Recipients' : `View ${elderlyList.length} Elderly Leads`}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const encoded = encodeURIComponent(alarm.customMessage);
                          window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition"
                        title="Open this reminder in WhatsApp Web to broadcast into your senior care group"
                      >
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                        <span>Open in WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerTest(alarm)}
                        disabled={isProcessing}
                        className="px-2.5 py-1 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-200 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                        title="Immediately test send this reminder to elderly members"
                      >
                        <Send className="w-3 h-3 text-[#c2f83a]" />
                        <span>Ring Alarm Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(alarm)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#141c2c] transition"
                        title="Customize time and reminder message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete care alarm "${alarm.title}"?`)) {
                            onDeleteAlarm(alarm.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Delete alarm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1b2537] bg-[#0a0f1a] flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#c2f83a]" />
            <span>Alarms stay persistently active until toggled OFF. Next automatic sweep at clock time.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] text-slate-200 text-xs font-semibold transition"
          >
            Close Alarms
          </button>
        </div>
      </div>

      {/* Edit / Create Alarm Sub-Modal */}
      {editingAlarm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#101726] border border-[#1b2537] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2537]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c2f83a]" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {isAddingNew ? 'Set New Care & Medicine Alarm' : 'Customize Care Alarm'}
                </h3>
              </div>
              <button onClick={() => setEditingAlarm(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              {/* Alarm Type Preset */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alarm Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(ALARM_TYPE_CONFIG) as AlarmType[]).map(t => {
                    const cfg = ALARM_TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    const isSelected = editingAlarm.alarmType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setEditingAlarm({
                            ...editingAlarm,
                            alarmType: t,
                            customMessage: cfg.defaultTemplate,
                            label: cfg.label
                          });
                        }}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-[#182738] border-[#c2f83a] text-[#c2f83a] font-bold'
                            : 'bg-[#141c2c] border-[#1e2a3c] text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] leading-tight truncate w-full">{cfg.label.split('/')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Clock Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Alarm Title *</label>
                  <input
                    type="text"
                    required
                    value={editingAlarm.title || ''}
                    onChange={(e) => setEditingAlarm({ ...editingAlarm, title: e.target.value })}
                    placeholder="e.g. Morning Medicine Alarm"
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Clock Alarm Time (24h) *</label>
                  <input
                    type="time"
                    required
                    value={editingAlarm.time || '08:00'}
                    onChange={(e) => setEditingAlarm({ ...editingAlarm, time: e.target.value })}
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>
              </div>

              {/* Age-Wise Elderly Filter */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Age-Wise Elderly Targeting: <span className="text-[#c2f83a]">Age {editingAlarm.targetAgeMin}+</span>
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { age: 50, label: '50+ (Elderly Community)' },
                    { age: 60, label: '60+ (Senior Citizens)' },
                    { age: 65, label: '65+ (Geriatric Care)' },
                    { age: 0, label: 'All Opted-in' },
                  ].map(opt => (
                    <button
                      key={opt.age}
                      type="button"
                      onClick={() => setEditingAlarm({ ...editingAlarm, targetAgeMin: opt.age, targetAudienceLabel: opt.label })}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] transition ${
                        editingAlarm.targetAgeMin === opt.age
                          ? 'bg-[#182738] border-[#c2f83a] text-[#c2f83a] font-bold'
                          : 'bg-[#141c2c] border-[#1e2a3c] text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label.split('(')[0]}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Currently matches: <strong>{getElderlyMembers(editingAlarm.targetAgeMin || 50).length} verified elderly members</strong>
                </div>
              </div>

              {/* Custom Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Custom WhatsApp Reminder Message *</label>
                  <span className="text-[10px] text-slate-500 font-mono">Supports *bold* and _italics_</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={editingAlarm.customMessage || ''}
                  onChange={(e) => setEditingAlarm({ ...editingAlarm, customMessage: e.target.value })}
                  placeholder="Enter the reminder message that will be notified to customers..."
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              {/* Initial Active State */}
              <div className="p-3 rounded-xl bg-[#0a0f1a] border border-[#1b2537] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Alarm Active on Save</div>
                  <div className="text-[10px] text-slate-400">Rings daily at the set clock time until turned off</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingAlarm.isActive ?? true}
                  onChange={(e) => setEditingAlarm({ ...editingAlarm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#c2f83a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1b2537]">
                <button
                  type="button"
                  onClick={() => setEditingAlarm(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black font-extrabold shadow-md transition disabled:opacity-50"
                >
                  {isProcessing ? 'Saving...' : 'Save & Set Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Smartphone Preview Sub-Modal */}
      {previewAlarm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#101726] border border-[#1b2537] rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2537]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Smartphone className="w-3.5 h-3.5 text-[#c2f83a]" />
                <span>Simulated WhatsApp Client</span>
              </div>
              <button onClick={() => setPreviewAlarm(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              Sent at <strong>{previewAlarm.time}</strong> to elderly customers (Age {previewAlarm.targetAgeMin}+)
            </div>

            <WhatsAppChatPreview
              message={previewAlarm.customMessage}
              mediaType="none"
              timestamp={new Date().toISOString()}
            />

            <button
              onClick={() => setPreviewAlarm(null)}
              className="w-full py-2 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] text-slate-300 text-xs font-semibold transition"
            >
              Close Simulator
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
