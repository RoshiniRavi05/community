import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { DiscountOffer } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.discounts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, discount, discountId, user = 'Admin' } = body;
    const db = getDatabase();

    if (action === 'CREATE') {
      const newDiscount: DiscountOffer = {
        ...discount,
        id: `disc_${Date.now()}`,
        code: discount.code.toUpperCase().trim(),
        usedCount: 0,
        status: 'active'
      };
      db.discounts.unshift(newDiscount);
      logAuditAction(user, 'DISCOUNT_CREATED', `Created discount promo code: "${newDiscount.code}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, discount: newDiscount });
    }

    if (action === 'DELETE') {
      db.discounts = db.discounts.filter(d => d.id !== discountId);
      saveDatabase(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
