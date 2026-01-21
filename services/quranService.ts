import { Reciter, SurahDetails } from '../types';
import { EVERY_AYAH_MAPPING } from '../constants';

export const fetchReciters = async (): Promise<Reciter[]> => {
  try {
    const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar');
    if (!response.ok) {
      throw new Error('Failed to fetch reciters');
    }
    const data = await response.json();
    const reciters: Reciter[] = [];

    // Map the V3 API structure (Reciter -> Moshaf[]) to our flat Reciter type
    if (data.reciters && Array.isArray(data.reciters)) {
      data.reciters.forEach((r: any) => {
        if (r.moshaf && Array.isArray(r.moshaf)) {
          r.moshaf.forEach((m: any) => {
            reciters.push({
              id: `${r.id}-${m.id}`,
              name: r.name,
              letter: r.letter,
              server: m.server,
              suras: m.surah_list,
              count: m.surah_total.toString(),
              rewaya: m.name
            });
          });
        }
      });
    }

    return reciters.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  } catch (error) {
    console.error("Error fetching reciters", error);
    return [];
  }
};

export const getSurahAudioUrl = (server: string, surahId: number): string => {
  const paddedId = surahId.toString().padStart(3, '0');
  return `${server}/${paddedId}.mp3`;
};

// Fetch full text of a Surah
export const fetchSurahText = async (surahId: number): Promise<SurahDetails | null> => {
  try {
    // Explicitly use quran-uthmani to ensure we know the text format for Basmalah removal
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === 'OK' && data.data) {
      return data.data as SurahDetails;
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch surah text", e);
    return null;
  }
};

// Determine if a reciter supports range downloading
// strictly rely on the manual mapping AND ensure it is Hafs rewaya
export const isLikelyRangeSupported = (reciter: Reciter): boolean => {
  // 1. Strict Rewaya Check: Most EveryAyah sources are Hafs. 
  // Filtering out other rewayas prevents mismatches where the name matches but the audio source doesn't align.
  // Note: We check for 'حفص' which covers 'حفص عن عاصم'
  if (!reciter.rewaya.includes('حفص')) {
    return false;
  }

  // 2. Name Mapping Check
  const reciterName = reciter.name;
  const mapKey = Object.keys(EVERY_AYAH_MAPPING).find(key => {
    const keyParts = key.split(' ');
    // Check if every part of the key exists in the reciter name
    return keyParts.every(part => reciterName.includes(part));
  });
  
  return !!mapKey;
};

// Check if a specific ayah exists for a reciter key (no retries, quick check)
export const checkAyahExists = async (reciterId: string, surahId: number, ayahId: number): Promise<boolean> => {
  const paddedSurah = surahId.toString().padStart(3, '0');
  const paddedAyah = ayahId.toString().padStart(3, '0');
  const url = `https://everyayah.com/data/${reciterId}/${paddedSurah}${paddedAyah}.mp3`;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    // If HEAD fails (e.g. CORS), try GET with abort controller to cancel body download
    try {
        const controller = new AbortController();
        const response = await fetch(url, { 
            method: 'GET', 
            signal: controller.signal 
        });
        if (response.ok) {
            controller.abort(); // We found it, stop downloading
            return true;
        }
        return false;
    } catch {
        return false;
    }
  }
};

// Helper for range download with retry logic
export const fetchAyahBlob = async (reciterId: string, surahId: number, ayahId: number): Promise<Blob> => {
  const paddedSurah = surahId.toString().padStart(3, '0');
  const paddedAyah = ayahId.toString().padStart(3, '0');
  const url = `https://everyayah.com/data/${reciterId}/${paddedSurah}${paddedAyah}.mp3`;
  
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url);
      
      // If file not found, don't retry, throw specific code
      if (response.status === 404) {
        throw new Error('AYAH_NOT_FOUND');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return await response.blob();
    } catch (error: any) {
      // Don't retry if it's a 404
      if (error.message === 'AYAH_NOT_FOUND' || (error.message && error.message.includes('404'))) {
        throw new Error('AYAH_NOT_FOUND');
      }

      attempt++;
      if (attempt === maxRetries) {
        throw new Error(`Ayah ${ayahId} fetch failed: ${error.message}`);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  throw new Error(`Ayah ${ayahId} fetch failed`);
};

export const concatBlobs = (blobs: Blob[], type = 'audio/mp3'): Blob => {
  return new Blob(blobs, { type });
};