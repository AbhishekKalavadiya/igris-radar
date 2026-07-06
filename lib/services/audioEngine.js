/**
 * audioEngine.js
 * Bridge to the Python FastAPI Audio DSP microservice.
 */

const AUDIO_ENGINE_URL = process.env.AUDIO_ENGINE_URL || "http://localhost:8000";

/**
 * Extracts a fingerprint from an audio file buffer.
 * @param {Buffer|Blob} fileData 
 * @param {string} filename 
 */
export async function extractFingerprint(fileData, filename) {
  const formData = new FormData();
  formData.append('file', new Blob([fileData]), filename);

  const response = await fetch(`${AUDIO_ENGINE_URL}/api/fingerprint/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract fingerprint from audio engine');
  }

  const data = await response.json();
  return data.fingerprint;
}

/**
 * Sends audio to be watermarked with an identifier.
 */
export async function embedWatermark(fileData, filename, identifier) {
  const formData = new FormData();
  formData.append('file', new Blob([fileData]), filename);
  formData.append('identifier', identifier);

  const response = await fetch(`${AUDIO_ENGINE_URL}/api/watermark/embed`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to embed watermark via audio engine');
  }

  // Returns the binary wav file
  return await response.arrayBuffer();
}

/**
 * Detects if a watermark is present in the audio.
 */
export async function detectWatermark(fileData, filename, identifier) {
  const formData = new FormData();
  formData.append('file', new Blob([fileData]), filename);
  formData.append('identifier', identifier);

  const response = await fetch(`${AUDIO_ENGINE_URL}/api/watermark/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to detect watermark via audio engine');
  }

  return await response.json();
}
