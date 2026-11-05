import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload, user = 'Admin' } = body;
    const db = getDatabase();

    if (action === 'TOGGLE_EMERGENCY_PAUSE') {
      db.antiSpamSettings.emergencyPauseActive = !db.antiSpamSettings.emergencyPauseActive;
      logAuditAction(
        user,
        db.antiSpamSettings.emergencyPauseActive ? 'EMERGENCY_PAUSE_ACTIVATED' : 'EMERGENCY_PAUSE_DEACTIVATED',
        `Kill-switch set to ${db.antiSpamSettings.emergencyPauseActive}`
      );
      saveDatabase(db);
      return NextResponse.json({ success: true, emergencyPauseActive: db.antiSpamSettings.emergencyPauseActive });
    }

    if (action === 'UPDATE_SETTINGS') {
      db.antiSpamSettings = { ...db.antiSpamSettings, ...payload };
      logAuditAction(user, 'SETTINGS_UPDATED', 'Updated anti-spam and frequency control parameters');
      saveDatabase(db);
      return NextResponse.json({ success: true, settings: db.antiSpamSettings });
    }

    if (action === 'RESET_DEMO_DATA') {
      const demoCampaign = db.campaigns.find(c => c.id === 'camp_demo_approval');
      if (demoCampaign) {
        demoCampaign.isDoctorApproved = false;
        demoCampaign.status = 'pending_approval';
        demoCampaign.sentCount = 0;
        demoCampaign.deliveredCount = 0;
        demoCampaign.approvedBy = undefined;
        demoCampaign.approvedAt = undefined;
      }
      logAuditAction(user, 'DEMO_DATA_RESET', 'Reset demo campaigns to initial approval test state');
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Demo data refreshed' });
    }

    if (action === 'RESOLVE_ERROR') {
      const err = db.errors.find(e => e.id === payload.errorId);
      if (err) {
        err.resolved = true;
        saveDatabase(db);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
