/**
 * Vercel Blob Storage Service
 * Saves scan images, weather data, and mandi prices to cloud storage
 */

const API_URL = '/api/blob';

/**
 * Upload scan image to blob storage
 */
export async function uploadScanImage(imageBase64, metadata = {}) {
  try {
    const result = await fetch(`${API_URL}?action=upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: imageBase64,
        folder: 'scans',
        metadata
      }),
    });

    if (!result.ok) throw new Error('Upload failed');
    
    return await result.json();
  } catch (error) {
    console.error('Blob upload error:', error);
    return null;
  }
}

/**
 * Save weather data to blob storage
 */
export async function saveWeatherToBlob(weatherData) {
  try {
    const result = await fetch(`${API_URL}?action=save-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weather',
        data: {
          ...weatherData,
          savedAt: new Date().toISOString()
        }
      }),
    });

    if (!result.ok) throw new Error('Save failed');
    
    return await result.json();
  } catch (error) {
    console.error('Weather save error:', error);
    return null;
  }
}

/**
 * Save mandi prices to blob storage
 */
export async function saveMandiToBlob(mandiData) {
  try {
    const result = await fetch(`${API_URL}?action=save-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mandi',
        data: {
          ...mandiData,
          savedAt: new Date().toISOString()
        }
      }),
    });

    if (!result.ok) throw new Error('Save failed');
    
    return await result.json();
  } catch (error) {
    console.error('Mandi save error:', error);
    return null;
  }
}

/**
 * Save training image to blob storage
 */
export async function saveTrainingImageToBlob(imageBase64, label, crop) {
  try {
    const result = await fetch(`${API_URL}?action=upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: imageBase64,
        folder: `training/${crop}/${label.replace(/\s+/g, '_')}`,
        metadata: { label, crop, timestamp: new Date().toISOString() }
      }),
    });

    if (!result.ok) throw new Error('Upload failed');
    
    return await result.json();
  } catch (error) {
    console.error('Training image upload error:', error);
    return null;
  }
}

/**
 * List all stored data by type
 */
export async function listBlobData(prefix = '') {
  try {
    const result = await fetch(`${API_URL}?action=list&prefix=${prefix}`);
    if (!result.ok) throw new Error('List failed');
    return await result.json();
  } catch (error) {
    console.error('List error:', error);
    return { blobs: [] };
  }
}

/**
 * Delete a blob
 */
export async function deleteBlob(url) {
  try {
    const result = await fetch(`${API_URL}?action=delete&url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    });
    return result.ok;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
