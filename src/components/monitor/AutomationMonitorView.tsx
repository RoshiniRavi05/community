'use client';

import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCw, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AutomationError, Campaign, AntiSpamSettings, WhatsAppConfig } from '@/lib/db/types';
import { formatWhatsAppDate } from '@/lib/utils';

interface AutomationMonitorViewProps {
  errors: AutomationError[];
  campaigns: Campaign[];
  settings: AntiSpamSettings;
  whatsappConfig: WhatsAppConfig;
  onToggleEmergencyPause: () => void;
  onResolveError: (errorId: string) => Promise<void>;
  onTriggerScheduler: () => void;
  isSyncing: boolean;
}

export const AutomationMonitorView: React.FC<AutomationMonitorViewProps> = ({
  errors,
  campaigns,
  settings,
  whatsappConfig,
  onToggleEmergencyPause,
  onResolveError,
  onTriggerScheduler,
  isSyncing
}) => {
  const unresolvedErrors = errors.filter(e => !e.resolved);
  const pendingCampaigns = campaigns.filter(c => ['scheduled', 'pending_approval', 'processing'].includes(c.status)).length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const failedCampaigns = campaigns.filter(c => ['failed', 'partially_failed'].includes(c.status)).length;

  return (
    <div className="space-y-4">
      {/* Emergency Kill-Switch Panel */}
      <div className={`p-5 rounded-xl border transition shadow-lg ${
        settings.emergencyPauseActive
          ? 'bg-[#2c151b] border-rose-500/50 text-rose-200'
          : 'bg-[#121826] border-[#1b2537] text-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {settings.emergencyPauseActive ? (
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#c2f83a] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Emergency Broadcast Kill-Switch
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  settings.emergencyPauseActive 
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' 
                    : 'bg-[#162725] text-[#c2f83a] border border-[#c2f83a]/30'
                }`}>
                  {settings.emergencyPauseActive ? 'PAUSED' : 'NORMAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                {settings.emergencyPauseActive
                  ? 'All automated outbound WhatsApp dispatches are blocked. No queued campaigns will send until resumed.'
                  : 'Automated queue runner is operational. Messages are dispatched in compliance with frequency capping and quiet hours.'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleEmergencyPause}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shadow-md ${
              settings.emergencyPauseActive
                ? 'bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {settings.emergencyPauseActive ? 'Resume Queue' : 'Pause All Dispatches'}
          </button>
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Scheduler Engine
          </div>
          <div className="text-base font-bold text-white mt-1">Autonomous runner</div>
          <div className="text-xs text-[#c2f83a] mt-1 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c2f83a] animate-pulse" />
            Status: Active
          </div>
        </div>

        <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            WhatsApp API Tier
          </div>
          <div className="text-base font-bold text-white mt-1">Quality: {whatsappConfig.qualityScore}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">{whatsappConfig.usedToday} / {whatsappConfig.dailyLimit} today</div>
        </div>

        <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Anti-Spam Filter
          </div>
          <div className="text-base font-bold text-white mt-1">Enforced</div>
          <div className="text-xs text-slate-400 mt-1">Quiet hours: {settings.quietHoursStart}–{settings.quietHoursEnd}</div>
        </div>

        <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 shadow-lg">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Queue Health
          </div>
          <div className="text-base font-bold text-[#38bdf8] mt-1 font-mono">{pendingCampaigns} queued</div>
          <div className="text-xs text-slate-400 mt-1">{completedCampaigns} completed, {failedCampaigns} failed</div>
        </div>
      </div>

      {/* Manual Trigger Sweep */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Manual Queue Sweep
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate all pending campaigns and immediately trigger due dispatches
          </p>
        </div>

        <button
          onClick={onTriggerScheduler}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a2538] hover:bg-[#22314a] border border-[#c2f83a]/30 text-[#c2f83a] text-xs font-semibold transition shadow-md disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#c2f83a]' : ''}`} />
          <span>{isSyncing ? 'Evaluating...' : 'Sweep Queue Now'}</span>
        </button>
      </div>

      {/* Incident Remediation Log */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#1b2537] flex items-center justify-between bg-[#0e1420]">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Automation Diagnostics & Incident Log ({unresolvedErrors.length} unresolved)
          </h3>
        </div>

        <div className="divide-y divide-[#1b2537]/50 text-xs">
          {errors.map(err => (
            <div 
              key={err.id}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                err.resolved ? 'bg-[#0f1523]/40 text-slate-400' : 'bg-[#121826]'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    err.severity === 'high' 
                      ? 'bg-[#2c151b] text-rose-400 border border-rose-500/30' 
                      : 'bg-[#1e293b] text-slate-300 border border-[#2b3952]'
                  }`}>
                    {err.severity}
                  </span>
                  <span className="font-semibold text-white">[{err.component}]</span>
                  <span className="text-[11px] text-slate-400 font-mono">{formatWhatsAppDate(err.timestamp)}</span>
                </div>
                <div className="text-slate-200 font-medium">{err.errorMessage}</div>
                {err.details && (
                  <div className="text-[11px] text-slate-400 font-mono">{err.details}</div>
                )}
              </div>

              <div className="shrink-0">
                {err.resolved ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#c2f83a]" />
                    <span>Resolved</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onResolveError(err.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#223049] text-slate-200 hover:text-white hover:bg-[#1a2538] transition"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}

          {errors.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              No system incidents logged. All automation components operational.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
