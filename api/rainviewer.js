export default async function handler(req, res) {
  try {
    // Fetch the latest available radar data from RainViewer
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');

    if (!response.ok) {
      throw new Error(`RainViewer API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache for 15 minutes
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('RainViewer API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch precipitation radar data' });
  }
}
