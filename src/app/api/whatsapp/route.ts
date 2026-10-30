import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { sendWhatsAppMessage, processInboundWebhook } from '@/lib/whatsapp/api';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json({
    config: {
      ...db.whatsappConfig,
      apiAccessToken: db.whatsappConfig.apiAccessToken ? '••••••••••••••••' + db.whatsappConfig.apiAccessToken.slice(-4) : ''
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, recipientPhone, messageText, mediaUrl, payload, user = 'Admin' } = body;
    const db = getDatabase();

    if (action === 'SEND_TEST') {
      const res = await sendWhatsAppMessage(
        recipientPhone,
        messageText || '*WhatsApp Community Test Message*\n\nThis is a verified test dispatch from your Community Management Platform.',
        mediaUrl,
        mediaUrl ? 'image' : 'none',
        db.whatsappConfig
      );

      if (res.success) {
        logAuditAction(user, 'TEST_MESSAGE_SENT', `Sent direct test message to ${recipientPhone}`);
      }

      return NextResponse.json(res);
    }

    if (action === 'SIMULATE_WEBHOOK') {
      // Handles test incoming webhook (e.g. STOP keyword or delivery receipt)
      let optOutHandled = false;
      let statusHandled = false;

      processInboundWebhook(
        payload,
        (phone, keyword) => {
          optOutHandled = true;
          // Find member and update to opted_out
          const member = db.members.find(m => m.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
          if (member) {
            member.consentStatus = 'opted_out';
            member.isUnsubscribed = true;
            member.notes = `Opted out automatically via webhook keyword ${keyword} at ${new Date().toISOString()}`;
          }
          logAuditAction('Webhook Listener', 'OPTOUT_RECEIVED', `Suppression list added phone ${phone} via keyword ${keyword}`);
        },
        (wamid, status, errorReason) => {
          statusHandled = true;
          const log = db.messageLogs.find(l => l.whatsappMessageId === wamid);
          if (log) {
            log.status = status;
            if (status === 'delivered') log.deliveredAt = new Date().toISOString();
            if (status === 'read') log.readAt = new Date().toISOString();
            if (errorReason) log.errorReason = errorReason;
          }
        }
      );

      saveDatabase(db);
      return NextResponse.json({ success: true, optOutHandled, statusHandled });
    }

    if (action === 'UPDATE_COMMUNITY_CONFIG') {
      const { communityName, mainInviteLink, integrationMode, defaultDispatchMethod } = body;
      if (communityName !== undefined) db.whatsappConfig.communityName = communityName;
      if (mainInviteLink !== undefined) db.whatsappConfig.mainInviteLink = mainInviteLink;
      if (integrationMode !== undefined) db.whatsappConfig.integrationMode = integrationMode;
      if (defaultDispatchMethod !== undefined) db.whatsappConfig.defaultDispatchMethod = defaultDispatchMethod;

      saveDatabase(db);
      logAuditAction(user, 'COMMUNITY_CONFIG_UPDATED', `Updated WhatsApp Community settings: ${communityName || 'Main'}`);
      return NextResponse.json({ success: true, config: db.whatsappConfig });
    }

    if (action === 'SAVE_COMMUNITY_GROUP') {
      const { group } = body;
      if (!group || !group.name || !group.inviteLink) {
        return NextResponse.json({ error: 'Group name and invite link are required' }, { status: 400 });
      }

      if (!db.whatsappConfig.communityGroups) {
        db.whatsappConfig.communityGroups = [];
      }

      const existingIndex = db.whatsappConfig.communityGroups.findIndex(g => g.id === group.id);
      if (existingIndex >= 0) {
        db.whatsappConfig.communityGroups[existingIndex] = {
          ...db.whatsappConfig.communityGroups[existingIndex],
          ...group
        };
      } else {
        const newGroup = {
          id: group.id || `grp_${Date.now()}`,
          name: group.name,
          description: group.description || '',
          inviteLink: group.inviteLink,
          category: group.category || 'general',
          targetAudience: group.targetAudience || 'All Members',
          memberCount: group.memberCount || 0,
          isPrimary: !!group.isPrimary
        };
        db.whatsappConfig.communityGroups.push(newGroup);
      }

      saveDatabase(db);
      logAuditAction(user, 'COMMUNITY_GROUP_SAVED', `Saved WhatsApp Community group: ${group.name}`);
      return NextResponse.json({ success: true, config: db.whatsappConfig });
    }

    if (action === 'DELETE_COMMUNITY_GROUP') {
      const { groupId } = body;
      if (db.whatsappConfig.communityGroups) {
        db.whatsappConfig.communityGroups = db.whatsappConfig.communityGroups.filter(g => g.id !== groupId);
        saveDatabase(db);
        logAuditAction(user, 'COMMUNITY_GROUP_DELETED', `Deleted WhatsApp Community group ID: ${groupId}`);
      }
      return NextResponse.json({ success: true, config: db.whatsappConfig });
    }

    if (action === 'UPDATE_CLOUD_API_CONFIG') {
      const { phoneNumberId, businessAccountId, apiAccessToken, webhookVerifyToken } = body;
      if (phoneNumberId !== undefined) db.whatsappConfig.phoneNumberId = phoneNumberId;
      if (businessAccountId !== undefined) db.whatsappConfig.businessAccountId = businessAccountId;
      if (apiAccessToken !== undefined && apiAccessToken && !apiAccessToken.startsWith('••••')) {
        db.whatsappConfig.apiAccessToken = apiAccessToken;
      }
      if (webhookVerifyToken !== undefined) db.whatsappConfig.webhookVerifyToken = webhookVerifyToken;

      saveDatabase(db);
      logAuditAction(user, 'CLOUD_API_CONFIG_UPDATED', `Updated WhatsApp Cloud API credentials`);
      return NextResponse.json({ success: true, config: db.whatsappConfig });
    }

    if (action === 'TEST_CONNECTION') {
      // Simulate verifying token against Meta Graph API
      db.whatsappConfig.connectionStatus = 'connected';
      db.whatsappConfig.qualityScore = 'GREEN';
      saveDatabase(db);
      return NextResponse.json({
        success: true,
        status: 'connected',
        qualityScore: 'GREEN',
        tier: 'Tier 1 (1,000 unique recipients/day)'
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
