import { NextResponse } from 'next/server';
import { runSchedulerExecution } from '@/lib/scheduler/engine';

export async function GET() {
  const result = await runSchedulerExecution();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: 'success',
    ...result
  });
}

export async function POST() {
  const result = await runSchedulerExecution();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: 'success',
    ...result
  });
}
