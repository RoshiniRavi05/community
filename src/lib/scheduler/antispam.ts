import { Member, Campaign, MessageLog, AntiSpamSettings } from '../db/types';

export interface AntiSpamValidationResult {
  allowed: boolean;
  reason?: string;
  code?: 'EMERGENCY_PAUSE' | 'OPT_OUT' | 'QUIET_HOURS' | 'DISALLOWED_DAY' | 'WEEKLY_LIMIT_EXCEEDED' | 'DAILY_LIMIT_EXCEEDED' | 'MIN_INTERVAL_VIOLATION' | 'DUPLICATE_MESSAGE' | 'UNVERIFIED_OR_NO_CONSENT';
  nextEligibleDate?: string;
}

export function isWithinQuietHours(settings: AntiSpamSettings, checkDate: Date = new Date()): boolean {
  if (!settings.quietHoursEnabled) return false;

  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);

  const currentMinutes = checkDate.getHours() * 60 + checkDate.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handles overnight quiet hours (e.g. 21:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

export function isAllowedDay(settings: AntiSpamSettings, checkDate: Date = new Date()): boolean {
  const day = checkDate.getDay(); // 0 is Sunday, 1 is Monday...
  return settings.allowedSendDays.includes(day);
}

export function validateMessageAgainstAntiSpam(
  member: Member,
  campaign: Campaign,
  recentLogs: MessageLog[],
  settings: AntiSpamSettings,
  now: Date = new Date()
): AntiSpamValidationResult {
  // 1. Emergency Pause Kill-Switch
  if (settings.emergencyPauseActive) {
    return {
      allowed: false,
      code: 'EMERGENCY_PAUSE',
      reason: 'Emergency Kill-Switch is active. All outbound automation is paused by Administrator.'
    };
  }

  // 2. Consent & Suppression Check
  if (member.isUnsubscribed || member.consentStatus === 'opted_out') {
    return {
      allowed: false,
      code: 'OPT_OUT',
      reason: `Recipient has opted out or is on the central suppression list (${member.phone}).`
    };
  }

  if (member.consentStatus !== 'opted_in') {
    return {
      allowed: false,
      code: 'UNVERIFIED_OR_NO_CONSENT',
      reason: 'Recipient has not provided verified messaging consent.'
    };
  }

  // 3. Quiet Hours Check
  if (isWithinQuietHours(settings, now)) {
    return {
      allowed: false,
      code: 'QUIET_HOURS',
      reason: `Current time is within protected Quiet Hours (${settings.quietHoursStart} - ${settings.quietHoursEnd}). Message deferred.`
    };
  }

  // 4. Allowed Sending Days
  if (!isAllowedDay(settings, now)) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = days[now.getDay()];
    return {
      allowed: false,
      code: 'DISALLOWED_DAY',
      reason: `Sending is not permitted on ${currentDayName} per organization frequency rules.`
    };
  }

  // Non-promotional campaigns (e.g., critical general updates or event reminders for already registered users)
  // have lighter frequency limits, but promotional campaigns (discount_offer, camp_event, reel_video) strictly enforce:
  const isPromotional = ['discount_offer', 'camp_event', 'reel_video'].includes(campaign.category);

  if (isPromotional) {
    // 5. Duplicate Message Prevention
    const duplicateWindowMs = settings.duplicatePreventionHours * 60 * 60 * 1000;
    const isDuplicate = recentLogs.some(log => {
      if (log.recipientPhone !== member.phone) return false;
      const logTime = new Date(log.timestamp).getTime();
      const isWithinWindow = (now.getTime() - logTime) < duplicateWindowMs;
      return isWithinWindow && (log.messageText.trim().slice(0, 40) === campaign.message.trim().slice(0, 40));
    });

    if (isDuplicate) {
      return {
        allowed: false,
        code: 'DUPLICATE_MESSAGE',
        reason: `Duplicate campaign text was already delivered to recipient within past ${settings.duplicatePreventionHours} hours.`
      };
    }

    // 6. Minimum Interval Check (e.g. 48 hours between promos)
    if (member.lastMessageDate) {
      const lastMsgTime = new Date(member.lastMessageDate).getTime();
      const intervalMs = settings.minIntervalHours * 60 * 60 * 1000;
      if (now.getTime() - lastMsgTime < intervalMs) {
        const nextEligible = new Date(lastMsgTime + intervalMs);
        return {
          allowed: false,
          code: 'MIN_INTERVAL_VIOLATION',
          reason: `Minimum interval of ${settings.minIntervalHours}h between promotional messages violated. Next eligible: ${nextEligible.toISOString()}`,
          nextEligibleDate: nextEligible.toISOString()
        };
      }
    }

    // 7. Frequency limit: Messages past 7 days & past 24 hours
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const recipientLogs = recentLogs.filter(log => 
      log.recipientPhone === member.phone && 
      ['sent', 'delivered', 'read'].includes(log.status)
    );

    const logsLast24h = recipientLogs.filter(l => new Date(l.timestamp).getTime() > oneDayAgo);
    if (logsLast24h.length >= settings.maxPromotionalPerDay) {
      return {
        allowed: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        reason: `Recipient reached daily promotional cap of ${settings.maxPromotionalPerDay} message(s)/day.`
      };
    }

    const logsLast7d = recipientLogs.filter(l => new Date(l.timestamp).getTime() > sevenDaysAgo);
    if (logsLast7d.length >= settings.maxPromotionalPerWeek) {
      return {
        allowed: false,
        code: 'WEEKLY_LIMIT_EXCEEDED',
        reason: `Recipient reached weekly promotional cap of ${settings.maxPromotionalPerWeek} message(s)/week.`
      };
    }
  }

  return { allowed: true };
}
