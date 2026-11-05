import { NextResponse } from 'next/server';
import { authenticateUser, SYSTEM_USERS } from '@/lib/auth/users';
import { logAuditAction } from '@/lib/db/storage';

export async function GET() {
  // Returns list of roles / public user profiles (without passwords)
  const publicUsers = SYSTEM_USERS.map(({ password: _, ...u }) => u);
  return NextResponse.json({ users: publicUsers });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, username, email, password } = body;

    if (action === 'LOGIN' || (!action && (username || email))) {
      const loginIdentifier = username || email;
      const user = authenticateUser(loginIdentifier, password);

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid username or password. Please check your credentials.' },
          { status: 401 }
        );
      }

      logAuditAction(
        `${user.name} (${user.role})`,
        'USER_LOGIN',
        `Logged in as ${user.role.toUpperCase()} (${user.username})`
      );

      return NextResponse.json({
        success: true,
        user
      });
    }

    if (action === 'LOGOUT') {
      const { user = 'User' } = body;
      logAuditAction(user, 'USER_LOGOUT', 'User signed out of the session');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal authentication error' },
      { status: 500 }
    );
  }
}
