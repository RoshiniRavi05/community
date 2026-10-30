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

    if (action === 'DELETE') {
      db.camps = db.camps.filter(c => c.id !== campId);
      saveDatabase(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
