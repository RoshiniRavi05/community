import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { Campaign } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.campaigns);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, campaign, campaignId, user = 'Admin', userRole = 'manager' } = body;
    const db = getDatabase();

    if (action === 'CREATE') {
      const isDoctor = userRole === 'doctor' || (user && user.toLowerCase().includes('doctor'));
      const cadence = campaign.cadence || 'none';
      let intervalDays = 1;
      if (cadence === 'daily') intervalDays = 1;
      else if (cadence === 'every_3_days') intervalDays = 3;
      else if (cadence === 'every_5_days') intervalDays = 5;
      else if (cadence === 'weekly') intervalDays = 7;
      else if (cadence === 'custom_days') intervalDays = Math.max(1, campaign.cadenceIntervalDays || 1);

      const occurrences = (cadence !== 'none')
        ? Math.min(30, Math.max(2, campaign.cadenceOccurrences || (cadence === 'daily' ? 7 : 5)))
        : 1;

      const baseTimestamp = new Date(campaign.scheduledAt || Date.now()).getTime();
      const parentId = `camp_${Date.now()}`;
      const createdCampaigns: Campaign[] = [];

      // If created by manager: ALWAYS requires Doctor approval before dispatch
      const requiresApproval = isDoctor ? (campaign.requiresApproval ?? false) : true;
      const isDoctorApproved = isDoctor ? true : false;
      const initialStatus = requiresApproval ? 'pending_approval' : 'scheduled';

      for (let i = 0; i < occurrences; i++) {
        const occurrenceId = i === 0 ? parentId : `camp_${Date.now()}_${i}`;
        const scheduledTime = new Date(baseTimestamp + (i * intervalDays * 24 * 60 * 60 * 1000)).toISOString();
        
        const instanceTitle = (cadence !== 'none' && occurrences > 1)
          ? `${campaign.title} [Occurrence ${i + 1}/${occurrences}]`
          : campaign.title;

        const newCampaign: Campaign = {
          ...campaign,
          id: occurrenceId,
          title: instanceTitle,
          scheduledAt: scheduledTime,
          cadence,
          cadenceIntervalDays: intervalDays,
          cadenceOccurrences: occurrences,
          parentCampaignId: parentId,
          seriesIndex: i + 1,
          status: initialStatus,
          requiresApproval,
          isDoctorApproved,
          approvedBy: isDoctor ? 'Dr. Dwaraga Sai (doctor@dwargasai.in)' : undefined,
          approvedAt: isDoctor ? new Date().toISOString() : undefined,
          totalRecipients: campaign.totalRecipients || db.members.length,
          sentCount: 0,
          deliveredCount: 0,
          readCount: 0,
          failedCount: 0,
          blockedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.campaigns.unshift(newCampaign);
        createdCampaigns.push(newCampaign);
      }

      logAuditAction(
        user, 
        'CAMPAIGN_CREATED', 
        `Created campaign: "${campaign.title}" (${cadence !== 'none' ? `Cadence: ${cadence}, ${occurrences} occurrences scheduled` : 'Single broadcast'}). Status: ${initialStatus}. Doctor approval required: ${requiresApproval}`
      );
      saveDatabase(db);
      return NextResponse.json({ success: true, campaign: createdCampaigns[0], allCreated: createdCampaigns });
    }

    if (action === 'CANCEL_SERIES') {
      const target = db.campaigns.find(c => c.id === campaignId);
      if (!target) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      const seriesRootId = target.parentCampaignId || target.id;
      
      let cancelledCount = 0;
      db.campaigns.forEach(c => {
        if ((c.parentCampaignId === seriesRootId || c.id === seriesRootId) && c.status === 'scheduled') {
          c.status = 'cancelled';
          c.updatedAt = new Date().toISOString();
          cancelledCount++;
        }
      });

      logAuditAction(user, 'SERIES_CANCELLED', `Cancelled ${cancelledCount} occurrences in cadence series "${target.title}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, cancelledCount });
    }

    if (action === 'APPROVE') {
      const target = db.campaigns.find(c => c.id === campaignId);
      if (!target) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      // Only Doctor role can approve campaigns
      if (userRole === 'manager') {
        return NextResponse.json(
          { error: 'Permission Denied: Only Dr. Dwaraga Sai (doctor@dwargasai.in) has authority to approve broadcasts.' },
          { status: 403 }
        );
      }

      target.status = 'scheduled';
      target.isDoctorApproved = true;
      target.approvedBy = 'Dr. Dwaraga Sai (doctor@dwargasai.in)';
      target.approvedAt = new Date().toISOString();
      target.updatedAt = new Date().toISOString();

      logAuditAction(
        'Dr. Dwaraga Sai (Doctor)',
        'CAMPAIGN_DOCTOR_APPROVED',
        `Doctor approved broadcast message: "${target.title}". Manager can now dispatch.`
      );
      saveDatabase(db);
      return NextResponse.json({ success: true, campaign: target });
    }

    if (action === 'CANCEL_ALL_SCHEDULED') {
      let cancelledCount = 0;
      db.campaigns.forEach(c => {
        if (c.status === 'scheduled' || c.status === 'pending_approval') {
          c.status = 'cancelled';
          c.updatedAt = new Date().toISOString();
          cancelledCount++;
        }
      });
      db.antiSpamSettings.emergencyPauseActive = true;
      logAuditAction(user, 'EMERGENCY_STOP_ALL_SCHEDULED', `Emergency stop cancelled ${cancelledCount} scheduled campaigns and paused dispatch`);
      saveDatabase(db);
      return NextResponse.json({ success: true, cancelledCount });
    }

    if (action === 'CANCEL') {
      const target = db.campaigns.find(c => c.id === campaignId);
      if (!target) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      target.status = 'cancelled';
      target.updatedAt = new Date().toISOString();

      logAuditAction(user, 'CAMPAIGN_CANCELLED', `Cancelled scheduled campaign: "${target.title}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, campaign: target });
    }

    if (action === 'DUPLICATE') {
      const original = db.campaigns.find(c => c.id === campaignId);
      if (!original) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      const nextWeekDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      const duplicate: Campaign = {
        ...original,
        id: `camp_${Date.now()}`,
        title: `${original.title} (Copy)`,
        scheduledAt: nextWeekDate,
        status: 'draft',
        isDoctorApproved: false,
        requiresApproval: true,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        blockedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.campaigns.unshift(duplicate);
      logAuditAction(user, 'CAMPAIGN_DUPLICATED', `Duplicated campaign "${original.title}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, campaign: duplicate });
    }

    if (action === 'SEND_NOW') {
      const target = db.campaigns.find(c => c.id === campaignId);
      if (!target) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      // STRICT ROLE-BASED CHECK:
      // Doctor must have approved this campaign before Manager can dispatch!
      if (!target.isDoctorApproved) {
        return NextResponse.json(
          {
            error: 'Broadcast Locked: Send Now is disabled. This broadcast has NOT been approved by the Doctor (doctor@dwargasai.in) yet.'
          },
          { status: 403 }
        );
      }

      // Move scheduled time to right now so scheduler picks it up immediately
      target.scheduledAt = new Date().toISOString();
      target.status = 'scheduled';
      target.requiresApproval = false;
      saveDatabase(db);

      const { runSchedulerExecution } = await import('@/lib/scheduler/engine');
      const execResult = await runSchedulerExecution();

      logAuditAction(
        user || 'Operations Manager',
        'CAMPAIGN_DISPATCHED_NOW',
        `Manager dispatched Doctor-approved broadcast: "${target.title}"`
      );

      return NextResponse.json({ success: true, result: execResult, campaign: target });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
