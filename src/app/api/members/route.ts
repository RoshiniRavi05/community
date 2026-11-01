import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { Member } from '@/lib/db/types';

export async function GET(req: Request) {
  const db = getDatabase();
  const url = new URL(req.url);
  const search = url.searchParams.get('q')?.toLowerCase() || '';
  const gender = url.searchParams.get('gender');
  const ageRange = url.searchParams.get('ageRange');
  const consent = url.searchParams.get('consent');

  let filtered = db.members;

  if (search) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(search) || 
      m.phone.includes(search) || 
      m.location.toLowerCase().includes(search)
    );
  }

  if (gender && gender !== 'all') {
    filtered = filtered.filter(m => m.gender === gender);
  }

  if (ageRange && ageRange !== 'all') {
    filtered = filtered.filter(m => {
      const age = m.age;
      const range = m.ageRange;
      if (ageRange === 'under_18') return (age !== undefined && age < 18) || range === '<18' || range === 'under_18';
      if (ageRange === '18_25') return (age !== undefined && age >= 18 && age <= 25) || range === '18-25';
      if (ageRange === '26_35') return (age !== undefined && age >= 26 && age <= 35) || range === '26-35';
      if (ageRange === '36_50') return (age !== undefined && age >= 36 && age <= 50) || range === '36-50';
      if (ageRange === '50_plus') return (age !== undefined && age > 50) || range === '50+' || range === '50_plus';
      return true;
    });
  }

  if (consent && consent !== 'all') {
    filtered = filtered.filter(m => m.consentStatus === consent);
  }

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, member, members, user = 'Admin' } = body;
    const db = getDatabase();

    if (action === 'CREATE') {
      // Check duplicate phone
      const exists = db.members.some(m => m.phone.replace(/\D/g, '') === member.phone.replace(/\D/g, ''));
      if (exists) {
        return NextResponse.json({ error: 'A member with this WhatsApp phone number already exists.' }, { status: 400 });
      }

      const newMember: Member = {
        ...member,
        id: `mem_${Date.now()}`,
        dateAdded: new Date().toISOString(),
        membershipStatus: member.membershipStatus || 'invitation_sent',
        consentTimestamp: member.consentStatus === 'opted_in' ? new Date().toISOString() : undefined,
        isUnsubscribed: member.consentStatus === 'opted_out'
      };

      db.members.unshift(newMember);
      logAuditAction(user, 'MEMBER_ADDED', `Added new community member: ${newMember.name} (${newMember.phone}) [Status: ${newMember.membershipStatus}]`);
      saveDatabase(db);
      return NextResponse.json({ success: true, member: newMember });
    }

    if (action === 'DELETE' || action === 'REMOVE') {
      const memberId = body.memberId || (member && member.id);
      const idx = db.members.findIndex(m => m.id === memberId);
      if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      const removed = db.members[idx];
      db.members.splice(idx, 1);
      logAuditAction(user, 'MEMBER_REMOVED', `Removed member from database: ${removed.name} (${removed.phone}). Note: Manual removal in WhatsApp Community required.`);
      saveDatabase(db);
      return NextResponse.json({ success: true, removedId: memberId });
    }

    if (action === 'UPDATE') {
      const idx = db.members.findIndex(m => m.id === member.id);
      if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

      // If consent status changed to opted_out, set unsubscribed
      if (member.consentStatus === 'opted_out') {
        member.isUnsubscribed = true;
      }

      db.members[idx] = { ...db.members[idx], ...member };
      logAuditAction(user, 'MEMBER_UPDATED', `Updated member: ${member.name} (${member.phone})`);
      saveDatabase(db);
      return NextResponse.json({ success: true, member: db.members[idx] });
    }

    if (action === 'IMPORT_CSV') {
      // Expects array of parsed records
      let added = 0;
      let duplicates = 0;

      for (const rec of (members as Partial<Member>[])) {
        if (!rec.phone || !rec.name) continue;
        const cleanRecPhone = rec.phone.replace(/\D/g, '');
        const duplicate = db.members.some(m => m.phone.replace(/\D/g, '') === cleanRecPhone);

        if (duplicate) {
          duplicates++;
          continue;
        }

        const newM: Member = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: rec.name.trim(),
          phone: rec.phone.trim().startsWith('+') ? rec.phone.trim() : `+${rec.phone.trim()}`,
          age: rec.age ? Number(rec.age) : undefined,
          ageRange: rec.ageRange || (rec.age && rec.age < 26 ? '18-25' : rec.age && rec.age < 36 ? '26-35' : '36-50'),
          gender: rec.gender || 'prefer_not_to_say',
          location: rec.location || 'Unknown',
          interests: Array.isArray(rec.interests) ? rec.interests : typeof rec.interests === 'string' ? (rec.interests as string).split(',').map(s => s.trim()) : [],
          preferredCategories: rec.preferredCategories || ['announcement'],
          dateAdded: new Date().toISOString(),
          verificationStatus: rec.verificationStatus || 'unverified',
          consentStatus: rec.consentStatus || 'opted_in',
          consentTimestamp: new Date().toISOString(),
          preferredChannel: 'whatsapp',
          isUnsubscribed: false
        };

        db.members.push(newM);
        added++;
      }

      logAuditAction(user, 'CSV_IMPORT', `Imported ${added} community members from CSV (${duplicates} skipped duplicates).`);
      saveDatabase(db);
      return NextResponse.json({ success: true, added, duplicates });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
