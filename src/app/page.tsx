'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from '@/components/layout/Sidebar';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { MembersView } from '@/components/members/MembersView';
import { SchedulerView } from '@/components/scheduler/SchedulerView';
import { MessageLogsView } from '@/components/logs/MessageLogsView';
import { SocialMediaView } from '@/components/social/SocialMediaView';
import { CampsView } from '@/components/camps/CampsView';
import { DiscountsView } from '@/components/discounts/DiscountsView';
import { AutomationMonitorView } from '@/components/monitor/AutomationMonitorView';
import { WhatsAppIntegrationView } from '@/components/whatsapp/WhatsAppIntegrationView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { CampaignComposerModal } from '@/components/scheduler/CampaignComposerModal';
import { CareAlarmModal } from '@/components/alarms/CareAlarmModal';
import { LoginView } from '@/components/auth/LoginView';
import { Sun, Moon, Stethoscope, ClipboardCheck, ArrowLeftRight, LogOut } from 'lucide-react';
import { AppState, Campaign, Member, SocialMediaPost, CampEvent, DiscountOffer, AntiSpamSettings, CareAlarm, AuthUser } from '@/lib/db/types';

export default function Home() {
  const [data, setData] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // ── Authentication / RBAC State ──
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('dwaragasai_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to parse saved user:', e);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('dwaragasai_user', JSON.stringify(user));
    } catch {}
    showToast(`Welcome, ${user.name}! Logged in as ${user.role.toUpperCase()}.`);
  };

  const handleSwitchRole = () => {
    const nextUser: AuthUser = currentUser?.role === 'doctor'
      ? {
          id: 'user_manager',
          username: 'manager@dwargasai.in',
          email: 'manager@dwargasai.in',
          name: 'Operations Manager',
          role: 'manager',
          title: 'Community Operations (Dispatcher)',
          avatar: 'OM'
        }
      : {
          id: 'user_doctor',
          username: 'doctor@dwargasai.in',
          email: 'doctor@dwargasai.in',
          name: 'Dr. Dwaraga Sai',
          role: 'doctor',
          title: 'Chief Medical Officer (Approver)',
          avatar: 'DS'
        };

    setCurrentUser(nextUser);
    try {
      localStorage.setItem('dwaragasai_user', JSON.stringify(nextUser));
    } catch {}
    showToast(`Active role switched to: ${nextUser.name} (${nextUser.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('dwaragasai_user');
    } catch {}
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOGOUT', user: currentUser?.name || 'User' })
    }).catch(() => {});
    showToast('Signed out of Dwaragasai Portal.');
  };

  // Sync dark class on root <html>
  const toggleTheme = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

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

  // Emergency Stop
  const handleStopAllScheduled = async () => {
    if (!confirm('Are you sure you want to trigger an Emergency Stop? This will halt outbound dispatch and cancel all currently scheduled messages.')) {
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL_ALL_SCHEDULED' })
      });
      const json = await res.json();
      showToast(`Emergency stop executed: ${json.cancelledCount || 0} scheduled messages cancelled and dispatches paused.`);
      await fetchData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
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
      body: JSON.stringify({
        action: 'CREATE',
        campaign: campaignData,
        user: currentUser?.name || 'Operations Manager',
        userRole: currentUser?.role || 'manager'
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to schedule campaign');
    }
    showToast(
      currentUser?.role === 'manager'
        ? `Broadcast "${campaignData.title}" submitted for Doctor review.`
        : `Broadcast "${campaignData.title}" scheduled with Doctor pre-approval.`
    );
    await fetchData();
  };

  const handleApproveCampaign = async (campaignId: string) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          campaignId,
          user: currentUser?.name || 'Dr. Dwaraga Sai',
          userRole: currentUser?.role || 'doctor'
        })
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || 'Only Doctor can approve campaigns.');
        return;
      }
      showToast('✓ Doctor approval granted. Manager can now dispatch this broadcast.');
      await fetchData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
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
        body: JSON.stringify({
          action: 'SEND_NOW',
          campaignId,
          user: currentUser?.name || 'Operations Manager',
          userRole: currentUser?.role || 'manager'
        })
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || 'Cannot send: Doctor approval required first.');
        return;
      }
      showToast(`Dispatch executed: ${json.result?.totalMessagesSent || 0} messages delivered.`);
      await fetchData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
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

  const handleRemoveMember = async (memberId: string) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE', memberId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove member');
    }
    showToast('Member removed from database.');
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

  // Care Alarm Actions
  const handleToggleCareAlarm = async (alarmId: string) => {
    const res = await fetch('/api/alarms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_ALARM', alarmId })
    });
    const json = await res.json();
    if (json.alarm) {
      showToast(json.alarm.isActive
        ? `Alarm "${json.alarm.title}" is ON.`
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
      showToast(`Alarm rung! Notified ${json.deliveredCount || 0} members.`);
      await fetchData();
    } finally {
      setIsSyncing(false);
    }
  };

  // WhatsApp
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

  const handleUpdateCommunityConfig = async (cfg: any) => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_COMMUNITY_CONFIG', ...cfg })
    });
    const json = await res.json();
    await fetchData();
    return json;
  };

  const handleSaveCommunityGroup = async (group: any) => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_COMMUNITY_GROUP', group })
    });
    const json = await res.json();
    await fetchData();
    return json;
  };

  const handleDeleteCommunityGroup = async (groupId: string) => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_COMMUNITY_GROUP', groupId })
    });
    const json = await res.json();
    await fetchData();
    return json;
  };

  const handleUpdateCloudApiConfig = async (cfg: any) => {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_CLOUD_API_CONFIG', ...cfg })
    });
    const json = await res.json();
    await fetchData();
    return json;
  };

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
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center text-[var(--text-sub)] space-y-2 font-sans">
        <div className="w-6 h-6 border-2 border-[#87936C] border-t-[#263323] rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Loading Dwaragasai Community Portal...</p>
      </div>
    );
  }

  // ── Show Login View if unauthenticated ──
  if (authChecked && !currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const unresolvedErrorsCount = data.errors.filter(e => !e.resolved).length;
  const scheduledNext7DaysCount = data.campaigns.filter(c => {
    if (c.status !== 'scheduled' && c.status !== 'pending_approval') return false;
    const t = new Date(c.scheduledAt).getTime();
    const now = Date.now();
    return t >= now && t <= now + 7 * 24 * 3600 * 1000;
  }).length;

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#263323] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-2xl border border-white/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#87936C] animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation with User profile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        emergencyPauseActive={data.antiSpamSettings.emergencyPauseActive}
        unresolvedErrorsCount={unresolvedErrorsCount}
        scheduledNext7DaysCount={scheduledNext7DaysCount}
        membersCount={data.members.length}
        onOpenCareAlarms={() => setIsCareAlarmModalOpen(true)}
        activeCareAlarmsCount={data.careAlarms?.filter(a => a.isActive).length ?? 0}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen bg-[var(--bg-app)]">
        {/* Global Page Header */}
        {activeTab !== 'overview' && activeTab !== 'dashboard' && (
          <div className="px-8 py-5 border-b border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
            <div>
              <h1 className="text-[24px] font-bold text-[var(--text-main)] tracking-tight capitalize leading-tight">
                {activeTab === 'social' ? 'Social Media' : activeTab === 'whatsapp' ? 'WhatsApp Integration' : activeTab}
              </h1>
              <p className="text-[13px] text-[var(--text-sub)] mt-0.5">
                {activeTab === 'members' && 'Manage your community members and their details.'}
                {activeTab === 'messages' && 'Create, schedule and manage community communications.'}
                {activeTab === 'scheduler' && 'Create, schedule and manage community communications.'}
                {activeTab === 'calendar' && 'Create, schedule and manage community communications.'}
                {activeTab === 'camps' && 'Organise camps, registrations and upcoming activities.'}
                {activeTab === 'social' && 'Manage social content and share updates with your community.'}
                {activeTab === 'analytics' && 'Understand your community\'s growth and communication performance.'}
                {activeTab === 'whatsapp' && 'Manage your WhatsApp connection and integration settings.'}
                {activeTab === 'settings' && 'Manage anti-spam rules, quiet hours, and frequency capping.'}
                {activeTab === 'logs' && 'Audit logs and delivery tracking of dispatched dispatches.'}
                {activeTab === 'monitor' && 'Real-time diagnostic monitor and error management.'}
                {activeTab === 'discounts' && 'Special camp discounts and referral perk vouchers.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Active Role Indicator & Quick Role Switcher */}
              {currentUser && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-xs ${
                      currentUser.role === 'doctor'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {currentUser.role === 'doctor' ? (
                      <>
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Doctor (Approver)</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Manager (Dispatcher)</span>
                      </>
                    )}
                  </span>

                  <button
                    onClick={handleSwitchRole}
                    title={`Switch role to ${currentUser.role === 'doctor' ? 'Manager (manager@dwargasai.in)' : 'Doctor (doctor@dwargasai.in)'}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition shadow-xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#87936C]" />
                    <span className="hidden sm:inline">Switch to {currentUser.role === 'doctor' ? 'Manager' : 'Doctor'}</span>
                  </button>
                </div>
              )}

              {/* Primary Action Button Contextual to Active Tab */}
              {activeTab === 'members' && (
                <button
                  onClick={() => {
                    const addBtn = document.querySelector('[data-action="add-member"]');
                    if (addBtn) (addBtn as HTMLButtonElement).click();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#87936C] hover:bg-[#77835c] text-white text-[13px] font-medium shadow-xs transition"
                >
                  <span>+ Add Member</span>
                </button>
              )}

              {(activeTab === 'messages' || activeTab === 'scheduler' || activeTab === 'calendar') && (
                <button
                  onClick={() => openScheduleComposer()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#87936C] hover:bg-[#77835c] text-white text-[13px] font-medium shadow-xs transition"
                >
                  <span>+ Create Message</span>
                </button>
              )}

              {activeTab === 'camps' && (
                <button
                  onClick={() => {
                    const addCampBtn = document.querySelector('[data-action="add-camp"]');
                    if (addCampBtn) (addCampBtn as HTMLButtonElement).click();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#87936C] hover:bg-[#77835c] text-white text-[13px] font-medium shadow-xs transition"
                >
                  <span>+ Add Camp</span>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${isDarkTheme ? 'Light' : 'Dark'} Mode`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition shadow-xs"
              >
                {isDarkTheme ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[var(--forest-green)]" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 px-8 py-6 max-w-[1400px] w-full">
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <OverviewView
              data={data}
              onOpenScheduleModal={openScheduleComposer}
              onOpenAddMember={() => setActiveTab('members')}
              onOpenCreateCamp={() => setActiveTab('camps')}
              onOpenCreateDiscount={() => setActiveTab('discounts')}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onTriggerScheduler={handleTriggerScheduler}
              isDarkTheme={isDarkTheme}
              onToggleTheme={toggleTheme}
            />
          )}

          {activeTab === 'members' && (
            <div className="theme-card p-6 shadow-xs">
              <MembersView
                members={data.members}
                segments={data.segments}
                messageLogs={data.messageLogs}
                onSaveMember={handleSaveMember}
                onRemoveMember={handleRemoveMember}
                onImportCsv={handleImportCsv}
              />
            </div>
          )}

          {(activeTab === 'messages' || activeTab === 'scheduler') && (
            <div className="theme-card p-6 shadow-xs">
              <SchedulerView
                campaigns={data.campaigns}
                segments={data.segments}
                members={data.members}
                onOpenComposer={openScheduleComposer}
                onApproveCampaign={handleApproveCampaign}
                onCancelCampaign={handleCancelCampaign}
                onDuplicateCampaign={handleDuplicateCampaign}
                onSendNow={handleSendNow}
                defaultView="table"
                onOpenCareAlarms={() => setIsCareAlarmModalOpen(true)}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="theme-card p-6 shadow-xs">
              <SchedulerView
                campaigns={data.campaigns}
                segments={data.segments}
                members={data.members}
                onOpenComposer={openScheduleComposer}
                onApproveCampaign={handleApproveCampaign}
                onCancelCampaign={handleCancelCampaign}
                onDuplicateCampaign={handleDuplicateCampaign}
                onSendNow={handleSendNow}
                defaultView="weekly_calendar"
                onOpenCareAlarms={() => setIsCareAlarmModalOpen(true)}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="theme-card p-6 shadow-xs">
              <MessageLogsView
                logs={data.messageLogs}
                onRetryFailed={async (logId) => {
                  showToast(`Retry dispatched for log ${logId}`);
                  await fetchData();
                }}
              />
            </div>
          )}

          {activeTab === 'social' && (
            <div className="theme-card p-6 shadow-xs">
              <SocialMediaView
                posts={data.socialPosts}
                onOpenScheduleModal={openScheduleComposer}
                onAddPost={handleAddSocialPost}
                onDeletePost={handleDeleteSocialPost}
              />
            </div>
          )}

          {activeTab === 'camps' && (
            <div className="theme-card p-6 shadow-xs">
              <CampsView
                camps={data.camps}
                onOpenScheduleModal={openScheduleComposer}
                onAddCamp={handleAddCamp}
                onDeleteCamp={handleDeleteCamp}
              />
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="theme-card p-6 shadow-xs">
              <DiscountsView
                discounts={data.discounts}
                onOpenScheduleModal={openScheduleComposer}
                onAddDiscount={handleAddDiscount}
                onDeleteDiscount={handleDeleteDiscount}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="theme-card p-6 shadow-xs">
              <AnalyticsView
                data={data}
                onToggleEmergencyPause={handleToggleEmergencyPause}
                onStopAllScheduled={handleStopAllScheduled}
              />
            </div>
          )}

          {activeTab === 'monitor' && (
            <div className="theme-card p-6 shadow-xs">
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
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="theme-card p-6 shadow-xs">
              <WhatsAppIntegrationView
                config={data.whatsappConfig}
                onSendTestMessage={handleSendTestMessage}
                onTestConnection={handleTestConnection}
                onSimulateWebhook={handleSimulateWebhook}
                onUpdateCommunityConfig={handleUpdateCommunityConfig}
                onSaveCommunityGroup={handleSaveCommunityGroup}
                onDeleteCommunityGroup={handleDeleteCommunityGroup}
                onUpdateCloudApiConfig={handleUpdateCloudApiConfig}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="theme-card p-6 shadow-xs">
              <SettingsView
                settings={data.antiSpamSettings}
                auditLogs={data.auditLogs}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>
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
          currentUser={currentUser}
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
