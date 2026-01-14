import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // Upload image
    if (req.method === 'POST' && action === 'upload') {
      const { file, folder = 'scans', metadata } = req.body;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Convert base64 to buffer
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `${folder}/${Date.now()}.jpg`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
      });

      return res.status(200).json({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        metadata: metadata || null
      });
    }

    // Save JSON data (weather, mandi prices)
    if (req.method === 'POST' && action === 'save-data') {
      const { type, data } = req.body;

      const filename = `data/${type}/${Date.now()}.json`;
      const blob = await put(filename, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
      });

      return res.status(200).json({
        success: true,
        url: blob.url,
        pathname: blob.pathname
      });
    }

    // List blobs
    if (req.method === 'GET' && action === 'list') {
      const { prefix = '' } = req.query;
      const { blobs } = await list({ prefix });

      return res.status(200).json({ blobs });
    }

    // Delete blob
    if (req.method === 'DELETE') {
      const { url } = req.query;
      if (url) {
        await del(url);
        return res.status(200).json({ success: true });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Blob API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
