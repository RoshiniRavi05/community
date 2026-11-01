import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { CampEvent } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.camps);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, camp, campId, user = 'Admin' } = body;
    const db = getDatabase();

    if (action === 'CREATE') {
      const newCamp: CampEvent = {
        ...camp,
        id: `camp_e_${Date.now()}`,
        registeredCount: 0,
        status: 'upcoming'
      };
      db.camps.unshift(newCamp);
      logAuditAction(user, 'CAMP_CREATED', `Created camp event: "${newCamp.title}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, camp: newCamp });
    }

    if (action === 'UPDATE') {
      const idx = db.camps.findIndex(c => c.id === camp.id);
      if (idx !== -1) {
        db.camps[idx] = { ...db.camps[idx], ...camp };
        logAuditAction(user, 'CAMP_UPDATED', `Updated camp: "${camp.title}"`);
        saveDatabase(db);
        return NextResponse.json({ success: true, camp: db.camps[idx] });
      }
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    if (action === 'DELETE') {
      const targetCamp = db.camps.find(c => c.id === campId);
      db.camps = db.camps.filter(c => c.id !== campId);
      logAuditAction(user, 'CAMP_DELETED', `Deleted camp event: "${targetCamp?.title || campId}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
