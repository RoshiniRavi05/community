'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { MembersView } from '@/components/members/MembersView';
import { SchedulerView } from '@/components/scheduler/SchedulerView';
import { MessageLogsView } from '@/components/logs/MessageLogsView';
import { SocialMediaView } from '@/components/social/SocialMediaView';
import { CampsView } from '@/components/camps/CampsView';
import { DiscountsView } from '@/components/discounts/DiscountsView';
import { AutomationMonitorView } from '@/components/monitor/AutomationMonitorView';
import { WhatsAppIntegrationView } from '@/components/whatsapp/WhatsAppIntegrationView';
import { SettingsView } from '@/components/settings/SettingsView';
import { CampaignComposerModal } from '@/components/scheduler/CampaignComposerModal';
import { CareAlarmModal } from '@/components/alarms/CareAlarmModal';
import { AppState, Campaign, Member, SocialMediaPost, CampEvent, DiscountOffer, AntiSpamSettings, CareAlarm } from '@/lib/db/types';

export default function Home() {
  const [data, setData] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Campaign Composer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<Partial<Campaign> | undefined>(undefined);

  // Care & Medicine Alarm Clock State
  const [isCareAlarmModalOpen, setIsCareAlarmModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Scheduler Sweep runner
  const handleTriggerScheduler = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/scheduler', { method: 'POST' });
      const json = await res.json();
      if (json.processedCampaigns > 0) {
        showToast(`Queue sweep complete: ${json.totalMessagesSent} sent, ${json.totalMessagesBlocked} filtered.`);
      } else {
        showToast('Queue sweep: 0 campaigns due at this time.');
      }
      await fetchData();
    } catch (err: any) {
      showToast(`Scheduler error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Emergency Pause Kill-Switch
  const handleToggleEmergencyPause = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_EMERGENCY_PAUSE' })
      });
      const json = await res.json();
      if (json.emergencyPauseActive) {
        showToast('Emergency kill-switch active: All outbound messages halted.');
      } else {
        showToast('Kill-switch deactivated: Automated dispatch resumed.');
      }
      await fetchData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Campaign actions
  const handleSaveCampaign = async (campaignData: Partial<Campaign>) => {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', campaign: campaignData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to schedule campaign');
    }
    showToast(`Campaign "${campaignData.title}" saved.`);
    await fetchData();
  };

  const handleApproveCampaign = async (campaignId: string) => {
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'APPROVE', campaignId })
    });
    showToast('Campaign approved for automated dispatch.');
    await fetchData();
  };

  const handleCancelCampaign = async (campaignId: string) => {
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CANCEL', campaignId })
    });
    showToast('Campaign cancelled.');
    await fetchData();
  };

  const handleDuplicateCampaign = async (campaignId: string) => {
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DUPLICATE', campaignId })
    });
    showToast('Campaign duplicated for next week.');
    await fetchData();
  };

  const handleSendNow = async (campaignId: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_NOW', campaignId })
      });
      const json = await res.json();
      showToast(`Dispatch executed: ${json.result?.totalMessagesSent || 0} messages delivered.`);
      await fetchData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Member actions
  const handleSaveMember = async (memberData: Partial<Member>) => {
    const action = memberData.id ? 'UPDATE' : 'CREATE';
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, member: memberData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save member');
    }
    showToast(`Member record ${action === 'CREATE' ? 'added' : 'updated'}.`);
    await fetchData();
  };

  const handleImportCsv = async (membersList: Partial<Member>[]) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'IMPORT_CSV', members: membersList })
    });
    const json = await res.json();
    showToast(`Imported ${json.added} members (${json.duplicates} skipped).`);
    await fetchData();
  };

  // Social media actions
  const handleAddSocialPost = async (post: Partial<SocialMediaPost>) => {
    await fetch('/api/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', post })
    });
    showToast('Video added to library.');
    await fetchData();
  };

  const handleDeleteSocialPost = async (postId: string) => {
    await fetch('/api/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE', postId })
    });
    showToast('Video removed.');
    await fetchData();
  };

  // Camp actions
  const handleAddCamp = async (camp: Partial<CampEvent>) => {
    await fetch('/api/camps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', camp })
    });
    showToast('Camp event created.');
    await fetchData();
  };

  const handleDeleteCamp = async (campId: string) => {
    await fetch('/api/camps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE', campId })
    });
    showToast('Camp event removed.');
    await fetchData();
  };

  // Discount actions
  const handleAddDiscount = async (discount: Partial<DiscountOffer>) => {
    await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', discount })
    });
    showToast('Discount code created.');
    await fetchData();
  };

  const handleDeleteDiscount = async (discountId: string) => {
    await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE', discountId })
    });
    showToast('Discount removed.');
    await fetchData();
  };

  // Care & Medicine Alarm Clock Actions
  const handleToggleCareAlarm = async (alarmId: string) => {
    const res = await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_ALARM', alarmId })
    });
    const json = await res.json();
    if (json.alarm) {
      showToast(json.alarm.isActive 
        ? `Alarm "${json.alarm.title}" is ON (Rings daily at ${json.alarm.time}).`
        : `Alarm "${json.alarm.title}" turned OFF.`);
    }
    await fetchData();
  };

  const handleSaveCareAlarm = async (alarmData: Partial<CareAlarm>) => {
    const action = alarmData.id ? 'UPDATE_ALARM' : 'CREATE_ALARM';
    const res = await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, alarmId: alarmData.id, alarmData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save alarm');
    }
    showToast(`Care alarm "${alarmData.title}" saved.`);
    await fetchData();
  };

  const handleDeleteCareAlarm = async (alarmId: string) => {
    await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_ALARM', alarmId })
    });
    showToast('Care alarm removed.');
    await fetchData();
  };

  const handleTriggerCareAlarmNow = async (alarmId: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRIGGER_ALARM_NOW', alarmId })
      });
      const json = await res.json();
      showToast(`Alarm rung! Notified ${json.deliveredCount || 0} elderly members (Age-wise filter).`);
      await fetchData();
    } finally {
      setIsSyncing(false);
    }
  };

  // WhatsApp integration test
  const handleSendTestMessage = async (phone: string, text: string) => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SEND_TEST', recipientPhone: phone, messageText: text })
    });
    return res.json();
  };

  const handleTestConnection = async () => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TEST_CONNECTION' })
    });
    return res.json();
  };

  const handleSimulateWebhook = async (payload: any) => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SIMULATE_WEBHOOK', payload })
    });
    await fetchData();
    return res.json();
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: Partial<AntiSpamSettings>) => {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: newSettings })
    });
    showToast('Anti-spam parameters updated.');
    await fetchData();
  };

  const handleResolveError = async (errorId: string) => {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESOLVE_ERROR', payload: { errorId } })
    });
    showToast('Incident marked resolved.');
    await fetchData();
  };

  const openScheduleComposer = (initial?: Partial<Campaign>) => {
    setComposerInitial(initial);
    setIsComposerOpen(true);
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center text-zinc-500 space-y-2 font-sans">
        <div className="w-6 h-6 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></div>
        <p className="text-xs">Loading community operations...</p>
      </div>
    );
  }

  const unresolvedErrorsCount = data.errors.filter(e => !e.resolved).length;
  const scheduledNext7DaysCount = data.campaigns.filter(c => {
    if (c.status !== 'scheduled' && c.status !== 'pending_approval') return false;
    const t = new Date(c.scheduledAt).getTime();
    const now = Date.now();
    return t >= now && t <= now + 7 * 24 * 3600 * 1000;
  }).length;

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#121826] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-[#1f2b3e] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#c2f83a] animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        emergencyPauseActive={data.antiSpamSettings.emergencyPauseActive}
        unresolvedErrorsCount={unresolvedErrorsCount}
        scheduledNext7DaysCount={scheduledNext7DaysCount}
        onOpenCareAlarms={() => setIsCareAlarmModalOpen(true)}
        activeCareAlarmsCount={data.careAlarms?.filter(a => a.isActive).length ?? 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <Header
          activeTab={activeTab}
          emergencyPauseActive={data.antiSpamSettings.emergencyPauseActive}
          onToggleEmergencyPause={handleToggleEmergencyPause}
          onTriggerScheduler={handleTriggerScheduler}
          onRefresh={fetchData}
          isSyncing={isSyncing}
          onOpenScheduleModal={() => openScheduleComposer()}
          onOpenCareAlarmsModal={() => setIsCareAlarmModalOpen(true)}
          activeAlarmsCount={data.careAlarms?.filter(a => a.isActive).length ?? 0}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewView
              data={data}
              onOpenScheduleModal={openScheduleComposer}
              onOpenAddMember={() => setActiveTab('members')}
              onOpenCreateCamp={() => setActiveTab('camps')}
              onOpenCreateDiscount={() => setActiveTab('discounts')}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onTriggerScheduler={handleTriggerScheduler}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={data.members}
              segments={data.segments}
              messageLogs={data.messageLogs}
              onSaveMember={handleSaveMember}
              onImportCsv={handleImportCsv}
            />
          )}

          {activeTab === 'scheduler' && (
            <SchedulerView
              campaigns={data.campaigns}
              segments={data.segments}
              members={data.members}
              onOpenComposer={openScheduleComposer}
              onApproveCampaign={handleApproveCampaign}
              onCancelCampaign={handleCancelCampaign}
              onDuplicateCampaign={handleDuplicateCampaign}
              onSendNow={handleSendNow}
              defaultView="agenda"
              onOpenCareAlarms={() => setIsCareAlarmModalOpen(true)}
            />
          )}

          {activeTab === 'calendar' && (
            <SchedulerView
              campaigns={data.campaigns}
              segments={data.segments}
              members={data.members}
              onOpenComposer={openScheduleComposer}
              onApproveCampaign={handleApproveCampaign}
              onCancelCampaign={handleCancelCampaign}
              onDuplicateCampaign={handleDuplicateCampaign}
              onSendNow={handleSendNow}
              defaultView="calendar"
              onOpenCareAlarms={() => setIsCareAlarmModalOpen(true)}
            />
          )}

          {activeTab === 'logs' && (
            <MessageLogsView
              logs={data.messageLogs}
              onRetryFailed={async (logId) => {
                showToast(`Retry dispatched for log ${logId}`);
                await fetchData();
              }}
            />
          )}

          {activeTab === 'social' && (
            <SocialMediaView
              posts={data.socialPosts}
              onOpenScheduleModal={openScheduleComposer}
              onAddPost={handleAddSocialPost}
              onDeletePost={handleDeleteSocialPost}
            />
          )}

          {activeTab === 'camps' && (
            <CampsView
              camps={data.camps}
              onOpenScheduleModal={openScheduleComposer}
              onAddCamp={handleAddCamp}
              onDeleteCamp={handleDeleteCamp}
            />
          )}

          {activeTab === 'discounts' && (
            <DiscountsView
              discounts={data.discounts}
              onOpenScheduleModal={openScheduleComposer}
              onAddDiscount={handleAddDiscount}
              onDeleteDiscount={handleDeleteDiscount}
            />
          )}

          {activeTab === 'monitor' && (
            <AutomationMonitorView
              errors={data.errors}
              campaigns={data.campaigns}
              settings={data.antiSpamSettings}
              whatsappConfig={data.whatsappConfig}
              onToggleEmergencyPause={handleToggleEmergencyPause}
              onResolveError={handleResolveError}
              onTriggerScheduler={handleTriggerScheduler}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppIntegrationView
              config={data.whatsappConfig}
              onSendTestMessage={handleSendTestMessage}
              onTestConnection={handleTestConnection}
              onSimulateWebhook={handleSimulateWebhook}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={data.antiSpamSettings}
              auditLogs={data.auditLogs}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>
      </div>

      {/* Global Campaign Composer Modal */}
      {isComposerOpen && (
        <CampaignComposerModal
          key={composerInitial?.id || (isComposerOpen ? 'open' : 'closed')}
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          onSave={handleSaveCampaign}
          initialData={composerInitial}
          segments={data.segments}
          members={data.members}
          settings={data.antiSpamSettings}
        />
      )}

      {/* Elderly Care & Medicine Clock Alarm Modal */}
      {isCareAlarmModalOpen && (
        <CareAlarmModal
          isOpen={isCareAlarmModalOpen}
          onClose={() => setIsCareAlarmModalOpen(false)}
          alarms={data.careAlarms || []}
          members={data.members}
          onToggleAlarm={handleToggleCareAlarm}
          onSaveAlarm={handleSaveCareAlarm}
          onDeleteAlarm={handleDeleteCareAlarm}
          onTriggerAlarmNow={handleTriggerCareAlarmNow}
        />
      )}
    </div>
  );
}
