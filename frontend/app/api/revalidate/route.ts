import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'portfolio_arl_revalidate_secret_key_2026';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const secret =
      request.headers.get('x-revalidate-secret') ||
      request.headers.get('X-Revalidate-Secret') ||
      request.nextUrl.searchParams.get('secret');

    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const singlePath = body.path || request.nextUrl.searchParams.get('path');
    const paths: string[] = body.paths || (singlePath ? [singlePath] : []);
    const singleTag = body.tag || request.nextUrl.searchParams.get('tag');
    const tags: string[] = body.tags || (singleTag ? [singleTag] : []);

    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];

    // Revalidate all requested paths (both page & layout)
    if (paths.length > 0) {
      for (const p of paths) {
        if (typeof p === 'string' && p.trim()) {
          const cleanP = p.trim();
          try {
            revalidatePath(cleanP, 'page');
            revalidatePath(cleanP, 'layout');
            revalidatedPaths.push(cleanP);
          } catch (e) {
            console.error(`Failed to revalidate path ${cleanP}:`, e);
          }
        }
      }
    }

    // Revalidate all requested tags
    if (tags.length > 0) {
      for (const t of tags) {
        if (typeof t === 'string' && t.trim()) {
          const cleanT = t.trim();
          try {
            revalidateTag(cleanT);
            revalidatedTags.push(cleanT);
          } catch (e) {
            console.error(`Failed to revalidate tag ${cleanT}:`, e);
          }
        }
      }
    }

    // Always revalidate layout & root page
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    if (!revalidatedPaths.includes('/')) {
      revalidatedPaths.push('/');
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidatedPaths,
      tags: revalidatedTags,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Revalidation failed' }, { status: 500 });
  }
}
