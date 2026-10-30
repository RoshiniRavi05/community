import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { CareAlarm, MessageLog } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.careAlarms || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, alarmId, alarmData, user = 'Admin' } = body;
    const db = getDatabase();
    if (!db.careAlarms) db.careAlarms = [];

    // 1. Toggle Alarm ON / OFF like an alarm clock
    if (action === 'TOGGLE_ALARM') {
      const target = db.careAlarms.find(a => a.id === alarmId);
      if (!target) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 });

      target.isActive = !target.isActive;
      target.updatedAt = new Date().toISOString();

      logAuditAction(
        user,
        'ALARM_TOGGLED',
        `Care Alarm "${target.title}" (${target.time}) turned ${target.isActive ? 'ON (Active daily)' : 'OFF (Silenced)'}`
      );

      saveDatabase(db);
      return NextResponse.json({ success: true, alarm: target });
    }

    // 2. Create New Clock-Style Alarm
    if (action === 'CREATE_ALARM') {
      const newAlarm: CareAlarm = {
        id: `alarm_${Date.now()}`,
        title: alarmData.title || 'Daily Routine Care Alarm',
        alarmType: alarmData.alarmType || 'medicine',
        time: alarmData.time || '08:00',
        label: alarmData.label || 'Medicine / Meal Reminder',
        customMessage: alarmData.customMessage || 'Gentle reminder from your care community.',
        isActive: alarmData.isActive ?? true,
        targetAgeMin: Number(alarmData.targetAgeMin || 50),
        targetAgeMax: alarmData.targetAgeMax ? Number(alarmData.targetAgeMax) : undefined,
        targetAudienceLabel: alarmData.targetAudienceLabel || `Elderly Members (${alarmData.targetAgeMin || 50}+ yrs)`,
        repeatDays: alarmData.repeatDays || ['Daily'],
        audioTone: alarmData.audioTone || 'gentle_chime',
        totalDeliveredCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.careAlarms.push(newAlarm);
      logAuditAction(user, 'ALARM_CREATED', `Created ${newAlarm.time} care alarm: "${newAlarm.title}" for age ${newAlarm.targetAgeMin}+`);
      saveDatabase(db);
      return NextResponse.json({ success: true, alarm: newAlarm });
    }

    // 3. Update Existing Alarm
    if (action === 'UPDATE_ALARM') {
      const index = db.careAlarms.findIndex(a => a.id === alarmId);
      if (index === -1) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 });

      db.careAlarms[index] = {
        ...db.careAlarms[index],
        ...alarmData,
        targetAgeMin: Number(alarmData.targetAgeMin ?? db.careAlarms[index].targetAgeMin),
        updatedAt: new Date().toISOString()
      };

      logAuditAction(user, 'ALARM_UPDATED', `Updated care alarm settings: "${db.careAlarms[index].title}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, alarm: db.careAlarms[index] });
    }

    // 4. Delete Alarm
    if (action === 'DELETE_ALARM') {
      const target = db.careAlarms.find(a => a.id === alarmId);
      db.careAlarms = db.careAlarms.filter(a => a.id !== alarmId);
      logAuditAction(user, 'ALARM_DELETED', `Removed care alarm "${target?.title || alarmId}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true });
    }

    // 5. Trigger Alarm Now (Ring & Send message to Elderly Members immediately)
    if (action === 'TRIGGER_ALARM_NOW') {
      const target = db.careAlarms.find(a => a.id === alarmId);
      if (!target) return NextResponse.json({ error: 'Alarm not found' }, { status: 404 });

      // Filter members age-wise for elderly people (min age threshold)
      const matchingElderly = db.members.filter(m => {
        const age = m.age || (m.ageRange === '50+' ? 60 : 0);
        const matchesMinAge = age >= target.targetAgeMin;
        const matchesMaxAge = target.targetAgeMax ? age <= target.targetAgeMax : true;
        const isOptedIn = m.consentStatus === 'opted_in' && !m.isUnsubscribed;
        return matchesMinAge && matchesMaxAge && isOptedIn;
      });

      // Dispatch simulated or live message log for each elderly member
      const timestamp = new Date().toISOString();
      const logsCreated: MessageLog[] = [];

      for (const member of matchingElderly) {
        const logEntry: MessageLog = {
          id: `log_alarm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campaignId: target.id,
          campaignTitle: `⏰ ${target.title} (${target.time})`,
          recipientId: member.id,
          recipientName: member.name,
          recipientPhone: member.phone,
          messageText: target.customMessage,
          status: 'delivered',
          timestamp,
          deliveredAt: timestamp,
          whatsappMessageId: `wamid.care_alarm_${Date.now()}_${member.id}`
        };

        db.messageLogs.unshift(logEntry);
        logsCreated.push(logEntry);
        member.lastMessageDate = timestamp;
      }

      target.totalDeliveredCount = (target.totalDeliveredCount || 0) + matchingElderly.length;
      target.lastTriggeredAt = timestamp;
      target.updatedAt = timestamp;

      logAuditAction(
        user,
        'ALARM_TRIGGERED_MANUAL',
        `Rung care alarm "${target.title}" — Dispatched to ${matchingElderly.length} elderly members (Age ${target.targetAgeMin}+)`
      );

      saveDatabase(db);
      return NextResponse.json({ 
        success: true, 
        deliveredCount: matchingElderly.length,
        recipients: matchingElderly.map(m => ({ name: m.name, age: m.age, phone: m.phone, location: m.location })),
        alarm: target
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
