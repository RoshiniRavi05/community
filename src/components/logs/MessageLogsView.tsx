'use client';

import React, { useState } from 'react';
import { 
  Search, 
  RotateCw, 
  X,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MessageLog, MessageDeliveryStatus } from '@/lib/db/types';
import { formatWhatsAppDate, formatPhoneNumber } from '@/lib/utils';

interface MessageLogsViewProps {
  logs: MessageLog[];
  onRetryFailed: (logId: string) => Promise<void>;
}

export const MessageLogsView: React.FC<MessageLogsViewProps> = ({ logs, onRetryFailed }) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MessageLog | null>(null);

  const filteredLogs = logs.filter(log => {
    if (search) {
      const q = search.toLowerCase();
      const match = log.recipientName.toLowerCase().includes(q) ||
                    log.recipientPhone.includes(q) ||
                    log.campaignTitle.toLowerCase().includes(q) ||
                    (log.whatsappMessageId && log.whatsappMessageId.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'blocked') {
        return ['blocked_spam', 'blocked_quiet_hours', 'blocked_optout'].includes(log.status);
      }
      return log.status === selectedStatus;
    }

    return true;
  });

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await onRetryFailed(logId);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: MessageDeliveryStatus) => {
    switch (status) {
      case 'read':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0c2438] text-[#38bdf8] border border-[#38bdf8]/30">
            Read
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#162725] text-[#c2f83a] border border-[#c2f83a]/30">
            Delivered
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-slate-300 border border-[#2b3952]">
            Sent
          </span>
        );
      case 'blocked_spam':
      case 'blocked_quiet_hours':
      case 'blocked_optout':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2a2114] text-amber-400 border border-amber-500/30">
            Skipped (Anti-Spam)
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2c151b] text-rose-400 border border-rose-500/30">
            Failed
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-slate-400 border border-[#2b3952] capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by recipient, campaign, or WAMID..."
              className="w-full bg-[#141c2c] border border-[#223049] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c2f83a]"
          >
            <option value="all">All Statuses</option>
            <option value="read">Read</option>
            <option value="delivered">Delivered</option>
            <option value="sent">Sent</option>
            <option value="blocked">Skipped (Anti-Spam)</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {filteredLogs.length} logged dispatches
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0e1420] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Scheduled / Sent</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Diagnostics / ID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2537]/50 text-slate-200">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#161f30] transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <span 
                      onClick={() => setSelectedRecord(log)}
                      className="font-medium text-white hover:text-[#c2f83a] cursor-pointer block truncate text-[13px] transition"
                    >
                      {log.campaignTitle}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-white">{log.recipientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatPhoneNumber(log.recipientPhone)}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-[11px] font-mono text-slate-300">
                    <div>{formatWhatsAppDate(log.timestamp)}</div>
                    {log.deliveredAt && (
                      <div className="text-slate-400 text-[10px]">Delivered: {formatWhatsAppDate(log.deliveredAt)}</div>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    {log.errorReason ? (
                      <span className="text-rose-400 text-[11px] line-clamp-1" title={log.errorReason}>
                        {log.errorReason}
                      </span>
                    ) : log.whatsappMessageId ? (
                      <span className="text-[10px] text-slate-400 font-mono truncate block" title={log.whatsappMessageId}>
                        {log.whatsappMessageId}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => setSelectedRecord(log)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium transition"
                    >
                      Details
                    </button>
                    {log.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(log.id)}
                        disabled={retryingId === log.id}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 transition disabled:opacity-50"
                      >
                        {retryingId === log.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No log records match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#121826] border border-[#1b2537] rounded-xl max-w-md w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2537] mb-4">
              <h3 className="text-sm font-semibold text-white">
                Message Dispatch Details
              </h3>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] tracking-wider">Campaign Title</span>
                <span className="font-semibold text-white text-[13px]">{selectedRecord.campaignTitle}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-[#141c2c] border border-[#223049]">
                  <span className="text-slate-400 block uppercase text-[10px]">Recipient</span>
                  <span className="font-medium text-white">{selectedRecord.recipientName}</span>
                  <div className="font-mono text-slate-400 text-[11px] mt-0.5">{selectedRecord.recipientPhone}</div>
                </div>

                <div className="p-3 rounded-lg bg-[#141c2c] border border-[#223049]">
                  <span className="text-slate-400 block uppercase text-[10px]">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-[#141c2c] border border-[#223049] font-mono text-[11px]">
                <div className="text-slate-300">Dispatched: {formatWhatsAppDate(selectedRecord.timestamp)}</div>
                {selectedRecord.deliveredAt && (
                  <div className="text-slate-300">Delivered: {formatWhatsAppDate(selectedRecord.deliveredAt)}</div>
                )}
                {selectedRecord.readAt && (
                  <div className="text-slate-300">Read: {formatWhatsAppDate(selectedRecord.readAt)}</div>
                )}
                {selectedRecord.whatsappMessageId && (
                  <div className="text-slate-400 break-all text-[10px] mt-2 pt-2 border-t border-[#223049]">
                    WAMID: {selectedRecord.whatsappMessageId}
                  </div>
                )}
              </div>

              {selectedRecord.errorReason && (
                <div className="p-3 rounded-lg bg-[#2c151b] border border-rose-500/30 text-rose-300 text-xs">
                  <span className="font-semibold block uppercase text-[10px] tracking-wider mb-1 text-rose-400">Failure Reason</span>
                  {selectedRecord.errorReason}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1b2537] mt-4">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-[#2b3952] text-xs font-semibold text-white transition"
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
