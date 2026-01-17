export default async function handler(req, res) {
  const { lat, lon, date } = req.query;
  const apiKey = process.env.VITE_VISUAL_CROSSING_API_KEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Visual Crossing API key is not configured' });
  }

  try {
    // Construct the API URL
    // If date is provided, use it. Otherwise, default to next 15 days forecast
    const timeline = date ? date : 'next15days';
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${timeline}?unitGroup=metric&key=${apiKey}&contentType=json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Visual Crossing API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache for 15 minutes
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Agricultural Weather API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch agricultural weather data' });
  }
}
