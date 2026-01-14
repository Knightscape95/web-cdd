import { put, list, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    // Upload image
    if (request.method === 'POST' && action === 'upload') {
      const formData = await request.formData();
      const file = formData.get('file');
      const folder = formData.get('folder') || 'scans';
      const metadata = formData.get('metadata');

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const filename = `${folder}/${Date.now()}_${file.name}`;
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
      });

      return new Response(JSON.stringify({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        metadata: metadata ? JSON.parse(metadata) : null
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save JSON data (weather, mandi prices)
    if (request.method === 'POST' && action === 'save-data') {
      const body = await request.json();
      const { type, data } = body;

      const filename = `data/${type}/${Date.now()}.json`;
      const blob = await put(filename, JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });

      return new Response(JSON.stringify({
        success: true,
        url: blob.url,
        pathname: blob.pathname
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // List blobs
    if (request.method === 'GET' && action === 'list') {
      const prefix = searchParams.get('prefix') || '';
      const { blobs } = await list({ prefix });

      return new Response(JSON.stringify({ blobs }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete blob
    if (request.method === 'DELETE') {
      const url = searchParams.get('url');
      if (url) {
        await del(url);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
