'use client';

import React from 'react';
import { formatWhatsAppDate, formatTimeOnly } from '@/lib/utils';
import { Check, CheckCheck, Phone, Video, MoreVertical, Paperclip, Smile, Mic, Send, ShieldCheck } from 'lucide-react';

interface WhatsAppChatPreviewProps {
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'none';
  linkPreviewUrl?: string;
  communityName?: string;
  senderName?: string;
  timestamp?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export const WhatsAppChatPreview: React.FC<WhatsAppChatPreviewProps> = ({
  message,
  mediaUrl,
  mediaType = 'none',
  linkPreviewUrl,
  communityName = 'Tech & Camp Community',
  senderName = 'Community Manager',
  timestamp = new Date().toISOString(),
  status = 'read'
}) => {
  // Format WhatsApp styled text (*bold*, _italic_, ~strike~)
  const formatText = (text: string) => {
    if (!text) return <span className="text-neutral-400 italic">No message text yet...</span>;

    // Split text by lines
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Basic bold formatting (*word*)
      const formattedLine = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                                .replace(/_([^_]+)_/g, '<em>$1</em>')
                                .replace(/~([^~]+)~/g, '<del>$1</del>');
      return (
        <span key={idx} className="block min-h-[1.2em]">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-[360px] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-[#0b141a] text-neutral-100 flex flex-col font-sans select-none">
      {/* Phone Header / Status Bar */}
      <div className="bg-[#1f2c34] px-4 py-2 flex items-center justify-between text-xs text-neutral-300">
        <span className="font-semibold">{formatTimeOnly(new Date().toISOString())}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-emerald-500 text-black px-1 rounded font-bold">5G</span>
          <div className="w-4 h-2 border border-neutral-300 rounded-sm p-[1px] flex items-center">
            <div className="w-full h-full bg-neutral-300 rounded-xs"></div>
          </div>
        </div>
      </div>

      {/* WhatsApp Chat Bar */}
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-neutral-700/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow">
              {communityName.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-400 rounded-full p-0.5">
              <ShieldCheck className="w-3 h-3 text-black" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold truncate max-w-[150px]">{communityName}</span>
            </div>
            <span className="text-[11px] text-emerald-400">Official Broadcast Community</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-neutral-300">
          <Video className="w-4 h-4 cursor-pointer hover:text-white" />
          <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
          <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Chat Canvas (WhatsApp dark patterned background) */}
      <div 
        className="flex-1 p-3 overflow-y-auto min-h-[360px] flex flex-col justify-end bg-[#0b141a] relative"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(37, 211, 102, 0.03) 0%, rgba(11, 20, 26, 0.95) 100%)`
        }}
      >
        {/* Date Pill */}
        <div className="flex justify-center mb-3">
          <span className="bg-[#182229] text-[10px] text-neutral-400 px-3 py-1 rounded-md shadow border border-neutral-800">
            TODAY
          </span>
        </div>

        {/* Community Encryption Banner */}
        <div className="flex justify-center mb-3">
          <span className="bg-[#182229]/80 text-[10px] text-zinc-400 px-3 py-1 rounded text-center max-w-[280px] border border-zinc-800">
            Messages to this community are end-to-end encrypted.
          </span>
        </div>

        {/* Message Bubble */}
        <div className="self-end max-w-[90%] bg-[#005c4b] text-neutral-100 rounded-2xl rounded-tr-xs p-2.5 shadow-md relative group mb-2 border border-emerald-600/30">
          {/* Sender header in community */}
          <div className="text-[11px] font-bold text-emerald-300 mb-1 flex items-center justify-between">
            <span>~ {senderName}</span>
            <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-1 rounded">Admin</span>
          </div>

          {/* Media Attachment if present */}
          {mediaUrl && mediaType !== 'none' && (
            <div className="mb-2 rounded-xl overflow-hidden border border-emerald-800/60 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={mediaUrl} 
                alt="Attachment preview" 
                className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300" 
              />
            </div>
          )}

          {/* Message Text */}
          <div className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
            {formatText(message)}
          </div>

          {/* Link Preview Card */}
          {linkPreviewUrl && (
            <a 
              href={linkPreviewUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 block bg-[#024437] rounded-lg p-2 text-xs border border-emerald-500/20 hover:bg-[#035243] transition"
            >
              <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider truncate">
                {linkPreviewUrl.replace(/^https?:\/\//, '').split('/')[0]}
              </div>
              <div className="font-medium text-neutral-100 truncate mt-0.5">
                Click to open verified link
              </div>
            </a>
          )}

          {/* Timestamp and Delivery Checks */}
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/70">
            <span>{formatTimeOnly(timestamp)}</span>
            {status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
            ) : status === 'delivered' ? (
              <CheckCheck className="w-3.5 h-3.5 text-neutral-300" />
            ) : (
              <Check className="w-3.5 h-3.5 text-neutral-300" />
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Input Simulation Footer */}
      <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-neutral-700/60">
        <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center gap-2 text-neutral-400 text-xs">
          <Smile className="w-4 h-4 cursor-pointer hover:text-white" />
          <span className="truncate flex-1">Community broadcast only</span>
          <Paperclip className="w-4 h-4 cursor-pointer hover:text-white" />
        </div>
        <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-black">
          <Mic className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
