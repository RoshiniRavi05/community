'use client';

import React, { useState } from 'react';
import { 
  Send, 
  RotateCw, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Users,
  MessageSquare,
  Link2,
  Globe,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { WhatsAppConfig, WhatsAppCommunityGroup } from '@/lib/db/types';

interface WhatsAppIntegrationViewProps {
  config: WhatsAppConfig;
  onSendTestMessage: (phone: string, text: string) => Promise<any>;
  onTestConnection: () => Promise<any>;
  onSimulateWebhook: (payload: any) => Promise<any>;
  onUpdateCommunityConfig?: (data: { 
    communityName?: string; 
    mainInviteLink?: string; 
    integrationMode?: 'community_group' | 'cloud_api' | 'hybrid'; 
    defaultDispatchMethod?: 'whatsapp_web' | 'direct_chat' | 'cloud_api' 
  }) => Promise<any>;
  onSaveCommunityGroup?: (group: Partial<WhatsAppCommunityGroup>) => Promise<any>;
  onDeleteCommunityGroup?: (groupId: string) => Promise<any>;
  onUpdateCloudApiConfig?: (data: {
    phoneNumberId?: string;
    businessAccountId?: string;
    apiAccessToken?: string;
    webhookVerifyToken?: string;
  }) => Promise<any>;
}

export const WhatsAppIntegrationView: React.FC<WhatsAppIntegrationViewProps> = ({
  config,
  onSendTestMessage,
  onTestConnection,
  onSimulateWebhook,
  onUpdateCommunityConfig,
  onSaveCommunityGroup,
  onDeleteCommunityGroup,
  onUpdateCloudApiConfig
}) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'dispatcher' | 'cloud_api'>('groups');
  
  // Community Settings State
  const [communityName, setCommunityName] = useState(config.communityName || 'CommUnity Health & Operations');
  const [mainInviteLink, setMainInviteLink] = useState(config.mainInviteLink || 'https://chat.whatsapp.com/sampleMainCommunityLink');
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group Modal / Form State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<WhatsAppCommunityGroup> | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // 1-Click WhatsApp Web Dispatcher State
  const [dispatchTarget, setDispatchTarget] = useState<string>('grp_main');
  const [customPhone, setCustomPhone] = useState('+91');
  const [broadcastMessage, setBroadcastMessage] = useState(
    '*Namaste Community Members*\n\nThis is an official announcement from our CommUnity Operations desk.\n\nPlease check our upcoming health camps and schedule: https://example.com/camps\n\n_Stay healthy and connected!_'
  );

  // Cloud API State
  const [phoneNumberId, setPhoneNumberId] = useState(config.phoneNumberId || '');
  const [businessAccountId, setBusinessAccountId] = useState(config.businessAccountId || '');
  const [apiAccessToken, setApiAccessToken] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(config.webhookVerifyToken || '');
  const [isSavingCloudApi, setIsSavingCloudApi] = useState(false);

  // Test messaging state
  const [testPhone, setTestPhone] = useState('+919876543210');
  const [testText, setTestText] = useState('Hello from CommUnity WhatsApp Operations. This is a verified test broadcast.');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    triggerToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCommunityConfig) return;
    setIsSavingCommunity(true);
    try {
      await onUpdateCommunityConfig({
        communityName,
        mainInviteLink,
        integrationMode: 'community_group',
        defaultDispatchMethod: 'whatsapp_web'
      });
      triggerToast('WhatsApp Community settings saved successfully.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setIsSavingCommunity(false);
    }
  };

  const handleOpenAddGroup = () => {
    setEditingGroup({
      id: '',
      name: '',
      description: '',
      inviteLink: 'https://chat.whatsapp.com/',
      category: 'announcement',
      targetAudience: 'All Members',
      memberCount: 0,
      isPrimary: false
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g: WhatsAppCommunityGroup) => {
    setEditingGroup({ ...g });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.name || !editingGroup.inviteLink) {
      alert('Group name and invite link are required.');
      return;
    }
    if (!onSaveCommunityGroup) return;

    setIsSavingGroup(true);
    try {
      await onSaveCommunityGroup(editingGroup);
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      triggerToast(`Group "${editingGroup.name}" saved!`);
    } catch (err: any) {
      alert(`Failed to save group: ${err.message}`);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to remove the WhatsApp group link for "${groupName}"?`)) return;
    if (!onDeleteCommunityGroup) return;
    try {
      await onDeleteCommunityGroup(groupId);
      triggerToast(`Removed group "${groupName}".`);
    } catch (err: any) {
      alert(`Failed to delete group: ${err.message}`);
    }
  };

  const handleDispatchWhatsAppWeb = () => {
    const encoded = encodeURIComponent(broadcastMessage);
    if (dispatchTarget === 'direct_phone') {
      const clean = customPhone.replace(/\D/g, '');
      if (!clean) {
        alert('Please enter a valid phone number.');
        return;
      }
      window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`, '_blank');
    } else {
      // Find the selected group
      const selected = (config.communityGroups || []).find(g => g.id === dispatchTarget);
      if (selected && selected.inviteLink) {
        // Copy text to clipboard and open group
        navigator.clipboard.writeText(broadcastMessage);
        triggerToast('Message copied to clipboard! Opening WhatsApp Group...');
        window.open(selected.inviteLink, '_blank');
      } else {
        // Fallback open WhatsApp web composer
        window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
      }
    }
  };

  const handleSaveCloudApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCloudApiConfig) return;
    setIsSavingCloudApi(true);
    try {
      await onUpdateCloudApiConfig({
        phoneNumberId,
        businessAccountId,
        apiAccessToken,
        webhookVerifyToken
      });
      triggerToast('Meta Cloud API credentials updated.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setIsSavingCloudApi(false);
    }
  };

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

  const communityGroups = config.communityGroups || [];

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#141e30] border border-[#c2f83a]/40 text-[#c2f83a] text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#c2f83a]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Community Status Header Banner */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <MessageSquare className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                {communityName || 'CommUnity Health & Operations'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                COMMUNITY CONNECTED
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#162032] text-slate-400 border border-[#22314a]">
                {communityGroups.length} Active Channels
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Connected directly to your real WhatsApp community groups and channels. Broadcast reminders, camp invitations, and senior care medication alerts with 1-click WhatsApp Web dispatch.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {mainInviteLink && (
            <a
              href={mainInviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Main Community</span>
            </a>
          )}
          <button
            onClick={() => handleCopy(mainInviteLink, 'Main Community Link')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#182335] hover:bg-[#202e45] text-slate-300 text-xs font-semibold border border-[#25354e] transition"
            title="Copy community invite link to share with members"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedLink === 'Main Community Link' ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1b2537] pb-3 text-xs">
        {[
          { id: 'groups', label: 'Community Groups & Channels', icon: Users, badge: communityGroups.length },
          { id: 'dispatcher', label: '1-Click WhatsApp Web Dispatcher', icon: Send },
          { id: 'cloud_api', label: 'Meta Cloud API (Server-to-Server)', icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition ${
                isActive 
                  ? 'bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30 shadow-[0_0_12px_rgba(194,248,58,0.12)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#121927]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c2f83a]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#c2f83a] text-black font-extrabold' : 'bg-[#182335] text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMMUNITY GROUPS & CHANNELS */}
      {activeTab === 'groups' && (
        <div className="space-y-5">
          {/* Main Community Invite Link Card */}
          <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-[#c2f83a]" />
                  Primary WhatsApp Community Link
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The primary umbrella invite link for your WhatsApp community. New members will join this group by default.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCommunity} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="e.g. Tiruppur Health & Senior Care"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  WhatsApp Group / Community Invite Link
                </label>
                <input
                  type="url"
                  value={mainInviteLink}
                  onChange={(e) => setMainInviteLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/Gabc123456789..."
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSavingCommunity}
                  className="w-full py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(194,248,58,0.25)] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSavingCommunity ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sub-Groups & Target Channels Grid Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c2f83a]" />
                Connected Community Groups & Focus Circles
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted WhatsApp groups for specific programs (e.g. Senior Citizens Medicine Circle, Tiruppur Camp Attendees).
              </p>
            </div>

            <button
              onClick={handleOpenAddGroup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2538] hover:bg-[#22314a] border border-[#c2f83a]/30 text-[#c2f83a] text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Connect New WhatsApp Group</span>
            </button>
          </div>

          {/* Connected Groups Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communityGroups.map(group => {
              const isCopied = copiedLink === group.id;
              return (
                <div 
                  key={group.id}
                  className="bg-[#121826] border border-[#1b2537] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-[#25354e] transition space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#182538] text-slate-300 font-semibold uppercase tracking-wider">
                        {group.category.replace('_', ' ')}
                      </span>
                      {group.isPrimary && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c2f83a]/20 text-[#c2f83a] font-bold">
                          PRIMARY
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {group.name}
                    </h4>

                    {group.description && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {group.description}
                      </p>
                    )}

                    <div className="p-2.5 rounded-xl bg-[#141c2c] border border-[#1e2a3c] space-y-1">
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        Target Audience
                      </div>
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {group.targetAudience || 'All Community Members'}
                      </div>
                    </div>
                  </div>

                  {/* Group Card Actions */}
                  <div className="pt-3 border-t border-[#1b2537] space-y-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={group.inviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Open Group</span>
                      </a>

                      <button
                        onClick={() => handleCopy(group.inviteLink, group.id)}
                        className="p-1.5 rounded-xl bg-[#182335] hover:bg-[#202e45] text-slate-300 border border-[#25354e] transition"
                        title="Copy WhatsApp invite link"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleOpenEditGroup(group)}
                        className="p-1.5 rounded-xl bg-[#182335] hover:bg-[#202e45] text-slate-300 border border-[#25354e] transition"
                        title="Edit group details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="p-1.5 rounded-xl bg-[#182335] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-[#25354e] transition"
                        title="Remove group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isCopied && (
                      <div className="text-[10px] text-[#c2f83a] font-medium text-center">
                        Invite link copied to clipboard!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 1-CLICK WHATSAPP WEB DISPATCHER */}
      {activeTab === 'dispatcher' && (
        <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#c2f83a]" />
              1-Click WhatsApp Web / Desktop Dispatcher
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Dispatch broadcasts directly from your own WhatsApp Web or Desktop application without requiring Meta approval or API quotas. Select a community group or direct member phone.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Dispatch Settings & Composer */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Destination Community Group or Direct Phone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {communityGroups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setDispatchTarget(group.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                        dispatchTarget === group.id
                          ? 'bg-[#182538] border-[#c2f83a]/60 text-white shadow-xs'
                          : 'bg-[#141c2c] border-[#1e2a3c] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{group.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        {group.category} · {group.targetAudience}
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setDispatchTarget('direct_phone')}
                    className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      dispatchTarget === 'direct_phone'
                        ? 'bg-[#182538] border-[#c2f83a]/60 text-white shadow-xs'
                        : 'bg-[#141c2c] border-[#1e2a3c] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Direct Recipient Phone</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Individual 1-on-1 member chat
                    </div>
                  </button>
                </div>
              </div>

              {dispatchTarget === 'direct_phone' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recipient Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Message Body (WhatsApp Markdown Supported: *bold*, _italics_, ~strike~)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {broadcastMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]/60 resize-y"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDispatchWhatsAppWeb}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <ExternalLink className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Launch in WhatsApp Web / App</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(broadcastMessage, 'Message Text')}
                  className="px-4 py-2.5 rounded-xl bg-[#182335] hover:bg-[#202e45] text-slate-200 text-xs font-semibold border border-[#25354e] flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{copiedLink === 'Message Text' ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            {/* Right: Quick Template Presets */}
            <div className="lg:col-span-4 bg-[#101622] border border-[#1a2538] rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c2f83a]" />
                Template Presets
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Click any preset below to auto-fill the message for your community:
              </p>

              <div className="space-y-2">
                {[
                  {
                    title: 'Morning Elderly Medicine Alarm',
                    text: '🌅 *Morning Prescription & Care Reminder*\n\nNamaste! Friendly reminder to take your prescribed morning diabetes and BP medication after a nourishing breakfast.\n\n_Stay vibrant and hydrated!_'
                  },
                  {
                    title: 'Tiruppur Health Camp Invite',
                    text: '🏥 *Free Health & Diagnostics Camp in Tiruppur*\n\nFree blood pressure, glucose check, and specialist consultation this Saturday.\n\nVenue: Town Hall, Tiruppur\nTime: 09:00 AM – 01:00 PM\n\nReply YES to reserve your token.'
                  },
                  {
                    title: 'Afternoon Diet & Lunch Alert',
                    text: '🍲 *Afternoon Meal & Hydration Reminder*\n\nTime for lunch! Please have your mild-spiced meals with warm water. Avoid prolonged sun exposure.\n\n_Wishing you good health!_'
                  },
                  {
                    title: 'Community Exclusive Privilege',
                    text: '🎉 *Special Community Privilege*\n\nUse code *COMMUNITY20* for 20% off all health checks and camp workshop passes this weekend.\n\nLink: https://example.com/camps'
                  }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBroadcastMessage(preset.text);
                      triggerToast(`Applied template "${preset.title}"`);
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-[#141d2c] hover:bg-[#1a2638] border border-[#1e2a3c] transition text-xs space-y-1"
                  >
                    <div className="font-semibold text-slate-200 text-[11px]">{preset.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 font-mono">{preset.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: META CLOUD API (SERVER-TO-SERVER) */}
      {activeTab === 'cloud_api' && (
        <div className="space-y-5">
          {/* Connection Banner */}
          <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Meta WhatsApp Cloud API (Automated Server Dispatch)
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#162725] text-[#c2f83a] border border-[#c2f83a]/30">
                  READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Phone ID: {config.phoneNumberId || 'Not configured'} · Daily Tier: {config.dailyLimit} messages
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
              <span>Meta API connection verified. Quality score: {connResult.qualityScore}, Tier limit active.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editable API Credentials Form */}
            <form onSubmit={handleSaveCloudApi} className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 shadow-lg space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                API Credentials Configuration
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 109845728495021"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp Business Account ID (WABA)</label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    placeholder="e.g. 204918274910283"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Permanent Access Token</label>
                  <input
                    type="password"
                    value={apiAccessToken}
                    onChange={(e) => setApiAccessToken(e.target.value)}
                    placeholder="EAAG9... (Leave blank to keep existing)"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={webhookVerifyToken}
                    onChange={(e) => setWebhookVerifyToken(e.target.value)}
                    placeholder="secret_token_for_meta_webhooks"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingCloudApi}
                  className="w-full py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(194,248,58,0.25)] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSavingCloudApi ? 'Saving Credentials...' : 'Save Cloud API Credentials'}</span>
                </button>
              </div>
            </form>

            {/* Test Message Dispatch */}
            <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Live API Test Message
                </h4>
                <p className="text-xs text-slate-400 mb-3.5">
                  Verify your Meta Cloud API setup by sending a test ping to any recipient number.
                </p>

                <form onSubmit={handleSendTest} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Destination Phone Number</label>
                    <input
                      type="text"
                      required
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Test Message Body</label>
                    <textarea
                      rows={3}
                      required
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      className="w-full bg-[#141c2c] border border-[#223049] rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#182335] hover:bg-[#202e45] border border-[#25354e] text-slate-200 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse text-[#c2f83a]' : 'text-[#c2f83a]'}`} />
                    <span>{isSending ? 'Sending API Packet...' : 'Dispatch Test Message'}</span>
                  </button>
                </form>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg border text-xs font-mono ${
                    testResult.success 
                      ? 'bg-[#162725] border-[#c2f83a]/30 text-[#c2f83a]' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {testResult.success ? (
                      <div>
                        <div>✓ Message dispatched successfully</div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">ID: {testResult.messageId}</div>
                      </div>
                    ) : (
                      <div>✗ Failed: {testResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Group Modal */}
      {isGroupModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#101726] border border-[#1b2537] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2537] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c2f83a]" />
                <span>{editingGroup.id ? 'Edit WhatsApp Group' : 'Connect New WhatsApp Group'}</span>
              </h3>
              <button
                onClick={() => { setIsGroupModalOpen(false); setEditingGroup(null); }}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveGroupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={editingGroup.name || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="e.g. Tiruppur Health Camp Leads"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp Invite Link *</label>
                <input
                  type="url"
                  required
                  value={editingGroup.inviteLink || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, inviteLink: e.target.value })}
                  placeholder="https://chat.whatsapp.com/Gabc123456789..."
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingGroup.category || 'announcement'}
                    onChange={(e) => setEditingGroup({ ...editingGroup, category: e.target.value as any })}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="announcement">Announcement Channel</option>
                    <option value="senior_care">Senior Care & Medicine</option>
                    <option value="camps_tiruppur">Tiruppur Health Camps</option>
                    <option value="tech_youth">Youth & Workshops</option>
                    <option value="general">General Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={editingGroup.targetAudience || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, targetAudience: e.target.value })}
                    placeholder="e.g. Elderly (50+ yrs)"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingGroup.description || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  placeholder="Brief summary of what is shared in this group..."
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsGroupModalOpen(false); setEditingGroup(null); }}
                  className="px-3.5 py-2 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGroup}
                  className="px-4 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black font-bold transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(194,248,58,0.25)] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSavingGroup ? 'Saving...' : 'Save Group'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
