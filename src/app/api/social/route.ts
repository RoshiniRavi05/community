import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logAuditAction } from '@/lib/db/storage';
import { SocialMediaPost } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.socialPosts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, post, postId, user = 'Admin' } = body;
    const db = getDatabase();

    if (action === 'CREATE') {
      const newPost: SocialMediaPost = {
        ...post,
        id: `soc_${Date.now()}`,
        dateAdded: new Date().toISOString()
      };
      db.socialPosts.unshift(newPost);
      logAuditAction(user, 'SOCIAL_POST_ADDED', `Added ${newPost.platform} post: "${newPost.title}"`);
      saveDatabase(db);
      return NextResponse.json({ success: true, post: newPost });
    }

    if (action === 'DELETE') {
      db.socialPosts = db.socialPosts.filter(p => p.id !== postId);
      saveDatabase(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
