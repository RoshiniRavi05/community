'use client';

import React, { useState } from 'react';
import { 
  Send, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { WhatsAppConfig } from '@/lib/db/types';

interface WhatsAppIntegrationViewProps {
  config: WhatsAppConfig;
  onSendTestMessage: (phone: string, text: string) => Promise<any>;
  onTestConnection: () => Promise<any>;
  onSimulateWebhook: (payload: any) => Promise<any>;
}

export const WhatsAppIntegrationView: React.FC<WhatsAppIntegrationViewProps> = ({
  config,
  onSendTestMessage,
  onTestConnection,
  onSimulateWebhook
}) => {
  const [testPhone, setTestPhone] = useState('+919876543210');
  const [testText, setTestText] = useState('Hello from your WhatsApp Community Platform. This is a verified test broadcast.');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<any>(null);

  const [webhookSimType, setWebhookSimType] = useState<'stop_optout' | 'delivered_receipt' | 'read_receipt'>('stop_optout');
  const [webhookSimResult, setWebhookSimResult] = useState<any>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTestResult(null);
    try {
      const res = await onSendTestMessage(testPhone, testText);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnResult(null);
    try {
      const res = await onTestConnection();
      setConnResult(res);
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSimulateWebhook = async () => {
    let payload: any = {};
    if (webhookSimType === 'stop_optout') {
      payload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: testPhone.replace(/\D/g, ''),
                text: { body: 'STOP' }
              }]
            }
          }]
        }]
      };
    } else {
      payload = {
        entry: [{
          changes: [{
            value: {
              statuses: [{
                id: 'wamid.test_simulation_123',
                status: webhookSimType === 'delivered_receipt' ? 'delivered' : 'read'
              }]
            }
          }]
        }]
      };
    }

    const res = await onSimulateWebhook(payload);
    setWebhookSimResult({ ...res, type: webhookSimType });
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Meta WhatsApp Cloud API
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#162725] text-[#c2f83a] border border-[#c2f83a]/30">
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Phone ID: {config.phoneNumberId} · Daily Tier: {config.dailyLimit} messages
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTestingConn}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a2538] hover:bg-[#22314a] border border-[#c2f83a]/30 text-[#c2f83a] text-xs font-semibold transition shadow-md disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-[#c2f83a]' : ''}`} />
          <span>{isTestingConn ? 'Pinging Meta...' : 'Test Connection'}</span>
        </button>
      </div>

      {connResult && (
        <div className="p-3.5 rounded-xl bg-[#162725] border border-[#c2f83a]/30 text-xs text-[#c2f83a] flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-[#c2f83a]" />
          <span>Meta API ping verified. Quality score: {connResult.qualityScore}, Tier limit active.</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Credentials & Quality */}
        <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            API Credentials
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Phone Number ID</label>
              <input
                type="text"
                readOnly
                value={config.phoneNumberId}
                className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-slate-300 font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                readOnly
                value={config.businessAccountId}
                className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-slate-300 font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Webhook Verify Token</label>
              <input
                type="text"
                readOnly
                value={config.webhookVerifyToken}
                className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-slate-300 font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-[#141c2c] border border-[#223049] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Daily Messaging Tier Usage</span>
                <span className="font-mono text-white font-semibold">{config.usedToday} / {config.dailyLimit}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                <div 
                  className="h-full bg-[#c2f83a] rounded-full" 
                  style={{ width: `${(config.usedToday / config.dailyLimit) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-[#c2f83a] font-medium">Quality: High (Tier 1 Verified)</div>
            </div>
          </div>
        </div>

        {/* Live Test Console */}
        <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Live Test Message Dispatch
            </h3>
            <p className="text-xs text-slate-400 mb-3.5">
              Send an instant message to verify delivery formatting and double-tick receipts.
            </p>

            <form onSubmit={handleSendTest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Destination Phone Number</label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Message Text</label>
                <textarea
                  rows={3}
                  required
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg p-2.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 rounded-lg bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Dispatch Test Message'}</span>
              </button>
            </form>

            {testResult && (
              <div className={`mt-3.5 p-3 rounded-lg text-xs border ${
                testResult.success 
                  ? 'bg-[#162725] border-[#c2f83a]/30 text-[#c2f83a]' 
                  : 'bg-[#2c151b] border-rose-500/30 text-rose-300'
              }`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-[#c2f83a]" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{testResult.success ? 'Message accepted by WhatsApp API' : 'Dispatch failed'}</span>
                </div>
                {testResult.messageId && (
                  <div className="font-mono text-[10px] mt-1 text-slate-400 break-all">
                    WAMID: {testResult.messageId}
                  </div>
                )}
                {testResult.error && (
                  <div className="mt-1 text-[11px] text-rose-300">{testResult.error}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Simulator */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 shadow-lg space-y-3.5">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Webhook Simulator
        </h3>
        <p className="text-xs text-slate-400">
          Simulate inbound Meta callbacks such as opt-out suppression replies or delivery receipts.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={webhookSimType}
            onChange={(e) => setWebhookSimType(e.target.value as 'stop_optout' | 'delivered_receipt' | 'read_receipt')}
            className="bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c2f83a]"
          >
            <option value="stop_optout">Simulate &quot;STOP&quot; Opt-Out Reply</option>
            <option value="delivered_receipt">Simulate &quot;Delivered&quot; Callback</option>
            <option value="read_receipt">Simulate &quot;Read&quot; Callback</option>
          </select>

          <button
            onClick={handleSimulateWebhook}
            className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-[#2b3952] text-white text-xs font-semibold border border-[#2b3952] transition shadow-xs"
          >
            Simulate Event
          </button>
        </div>

        {webhookSimResult && (
          <div className="p-3 rounded-lg bg-[#141c2c] border border-[#223049] text-xs font-mono text-slate-300">
            Processed: {JSON.stringify(webhookSimResult)}
          </div>
        )}
      </div>
    </div>
  );
};
