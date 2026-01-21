export interface Reciter {
  id: string;
  name: string;
  letter: string;
  server: string; // The base URL for the MP3 files
  suras: string; // Comma separated string of available surah IDs
  count: string;
  rewaya: string;
}

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  ayahCount: number;
  type: string; // Meccan or Medinan
}

export interface AudioState {
  isPlaying: boolean;
  currentSurah: Surah | null;
  currentReciter: Reciter | null;
  currentTime: number;
  duration: number;
  volume: number;
}

export enum ViewState {
  RECITERS = 'RECITERS',
  SURAHS = 'SURAHS',
}

// Mapping for EveryAyah API to support range downloads
export interface ReciterMap {
  [key: string]: string; 
}

// API Response types for Quran Text
export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahDetails {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}