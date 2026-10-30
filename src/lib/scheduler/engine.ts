import { getDatabase, saveDatabase, logAuditAction } from '../db/storage';
import { validateMessageAgainstAntiSpam } from './antispam';
import { sendWhatsAppMessage } from '../whatsapp/api';
import { Campaign, MessageLog, AutomationError } from '../db/types';

export interface SchedulerRunResult {
  processedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesBlocked: number;
  totalErrors: number;
  details: string[];
}

export async function runSchedulerExecution(): Promise<SchedulerRunResult> {
  const db = getDatabase();
  const now = new Date();
  const result: SchedulerRunResult = {
    processedCampaigns: 0,
    totalMessagesSent: 0,
    totalMessagesBlocked: 0,
    totalErrors: 0,
    details: []
  };

  // Check emergency pause
  if (db.antiSpamSettings.emergencyPauseActive) {
    result.details.push('Emergency Pause active: Scheduler sweep skipped outbound messages.');
    return result;
  }

  // Find campaigns ready for processing:
  // scheduled campaigns whose scheduledAt is past or within 1 minute of now
  const dueCampaigns = db.campaigns.filter(c => {
    if (c.status !== 'scheduled') return false;
    const scheduledTime = new Date(c.scheduledAt).getTime();
    return scheduledTime <= now.getTime();
  });

  for (const campaign of dueCampaigns) {
    result.processedCampaigns++;
    campaign.status = 'processing';
    saveDatabase(db);

    // Target members
    let recipients = db.members;
    if (campaign.targetSegmentId !== 'all' && campaign.targetSegmentId !== 'seg_all') {
      const segment = db.segments.find(s => s.id === campaign.targetSegmentId);
      if (segment) {
        recipients = db.members.filter(m => {
          if (segment.filters.consentOnly && m.consentStatus !== 'opted_in') return false;
          if (segment.filters.gender && segment.filters.gender.length > 0) {
            if (!segment.filters.gender.includes(m.gender)) return false;
          }
          if (segment.filters.interests && segment.filters.interests.length > 0) {
            const hasInterest = m.interests.some(i => segment.filters.interests!.includes(i));
            if (!hasInterest) return false;
          }
          return true;
        });
      }
    }

    campaign.totalRecipients = recipients.length;
    let sentCount = 0;
    let blockedCount = 0;
    let failedCount = 0;

    for (const member of recipients) {
      // 1. Anti-spam & Frequency Validation
      const validation = validateMessageAgainstAntiSpam(
        member,
        campaign,
        db.messageLogs,
        db.antiSpamSettings,
        now
      );

      if (!validation.allowed) {
        blockedCount++;
        result.totalMessagesBlocked++;

        const logStatus = validation.code === 'OPT_OUT' 
          ? 'blocked_optout' 
          : validation.code === 'QUIET_HOURS'
          ? 'blocked_quiet_hours'
          : 'blocked_spam';

        const blockedLog: MessageLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          recipientId: member.id,
          recipientName: member.name,
          recipientPhone: member.phone,
          messageText: campaign.message,
          mediaUrl: campaign.mediaUrl,
          status: logStatus,
          errorReason: validation.reason,
          timestamp: now.toISOString()
        };
        db.messageLogs.unshift(blockedLog);
        continue;
      }

      // 2. Dispatch via WhatsApp Cloud API
      const sendRes = await sendWhatsAppMessage(
        member.phone,
        campaign.message,
        campaign.mediaUrl,
        campaign.mediaType,
        db.whatsappConfig
      );

      if (sendRes.success) {
        sentCount++;
        result.totalMessagesSent++;

        const successLog: MessageLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          recipientId: member.id,
          recipientName: member.name,
          recipientPhone: member.phone,
          messageText: campaign.message,
          mediaUrl: campaign.mediaUrl,
          status: 'sent',
          whatsappMessageId: sendRes.messageId,
          timestamp: now.toISOString(),
          deliveredAt: new Date(now.getTime() + 2000).toISOString()
        };
        db.messageLogs.unshift(successLog);

        // Update member communication history
        member.lastMessageDate = now.toISOString();
        const minIntervalHours = db.antiSpamSettings.minIntervalHours || 48;
        member.nextEligiblePromoDate = new Date(now.getTime() + minIntervalHours * 3600000).toISOString();
      } else {
        failedCount++;
        result.totalErrors++;

        const failLog: MessageLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          recipientId: member.id,
          recipientName: member.name,
          recipientPhone: member.phone,
          messageText: campaign.message,
          mediaUrl: campaign.mediaUrl,
          status: 'failed',
          errorReason: sendRes.error,
          timestamp: now.toISOString()
        };
        db.messageLogs.unshift(failLog);

        const newError: AutomationError = {
          id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          timestamp: now.toISOString(),
          severity: 'high',
          component: 'WhatsApp API',
          errorMessage: `Failed sending to ${member.phone}: ${sendRes.error}`,
          campaignId: campaign.id,
          resolved: false
        };
        db.errors.unshift(newError);
      }
    }

    campaign.sentCount = sentCount;
    campaign.deliveredCount = sentCount; // Initial delivery receipt
    campaign.blockedCount = blockedCount;
    campaign.failedCount = failedCount;
    campaign.updatedAt = now.toISOString();

    if (failedCount > 0 && sentCount > 0) {
      campaign.status = 'partially_failed';
    } else if (failedCount > 0 && sentCount === 0) {
      campaign.status = 'failed';
    } else {
      campaign.status = 'completed';
    }

    result.details.push(
      `Campaign "${campaign.title}": ${sentCount} sent, ${blockedCount} blocked by anti-spam, ${failedCount} failed.`
    );
  }

  saveDatabase(db);
  if (result.processedCampaigns > 0) {
    logAuditAction('Background Scheduler', 'DISPATCH_COMPLETED', `Processed ${result.processedCampaigns} campaigns: ${result.totalMessagesSent} delivered.`);
  }

  return result;
}
