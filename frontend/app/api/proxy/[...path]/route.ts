import { NextRequest, NextResponse } from 'next/server';

const SERVER_API_URL = process.env.NEXT_SERVER_API_URL || 'http://localhost:8080/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join('/');
  const searchParams = req.nextUrl.search;
  const targetUrl = `${SERVER_API_URL}/${targetPath}${searchParams}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Forward cookies
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  let body: any = null;
  if (!['GET', 'HEAD'].includes(req.method)) {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      body = await req.arrayBuffer();
      headers.set('content-type', contentType);
    } else {
      body = await req.text();
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      cache: 'no-store',
      // @ts-ignore
      duplex: 'half',
    });

    // Check if SSE stream
    const isSSE = response.headers.get('content-type')?.includes('text/event-stream');
    if (isSSE && response.body) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    const resHeaders = new Headers();
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        resHeaders.append('set-cookie', val);
      } else {
        resHeaders.set(key, val);
      }
    });

    // Stream media, attachments, and binary files directly
    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';
    if (
      response.body &&
      (contentDisposition.includes('attachment') ||
        contentType.startsWith('video/') ||
        contentType.startsWith('audio/') ||
        contentType.startsWith('image/'))
    ) {
      return new Response(response.body, {
        status: response.status,
        headers: resHeaders,
      });
    }

    // Enforce no-cache on other proxy responses
    resHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    resHeaders.set('Pragma', 'no-cache');
    resHeaders.set('Expires', '0');

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, message: err?.message || 'Proxy request failed', data: null },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
