import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Reciter, Surah } from '../types';
import { EVERY_AYAH_MAPPING } from '../constants';
import { getSurahAudioUrl, fetchAyahBlob, concatBlobs, checkAyahExists, isLikelyRangeSupported } from '../services/quranService';

interface DownloadModalProps {
  reciter: Reciter;
  surah: Surah;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ reciter, surah, onClose }) => {
  const [mode, setMode] = useState<'full' | 'range'>('full');
  
  const [startAyah, setStartAyah] = useState<string>('1');
  const [endAyah, setEndAyah] = useState<string>(surah.ayahCount.toString());
  
  const [status, setStatus] = useState<'idle' | 'verifying' | 'downloading' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const supportsRange = isLikelyRangeSupported(reciter);

  useEffect(() => {
    if (mode === 'range' && !supportsRange) {
      setMode('full');
    }
  }, [mode, supportsRange]);

  const handleFullDownload = async () => {
    setStatus('downloading');
    try {
      const url = getSurahAudioUrl(reciter.server, surah.id);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network error");
      const blob = await response.blob();
      
      const downloadUrl = URL.createObjectURL(blob);
      triggerDownload(downloadUrl, `Surah_${surah.englishName}_${reciter.name}.mp3`);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMessage('فشل التحميل، يرجى المحاولة لاحقاً');
      setStatus('error');
    }
  };

  const handleRangeDownload = async () => {
    const start = startAyah === '' ? 0 : parseInt(startAyah);
    const end = endAyah === '' ? 0 : parseInt(endAyah);

    if (!start || !end || start > end || start < 1 || end > surah.ayahCount) {
      setErrorMessage('يرجى اختيار نطاق آيات صحيح');
      setStatus('error');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    const candidates: string[] = [];
    
    const reciterName = reciter.name;
    const mapKey = Object.keys(EVERY_AYAH_MAPPING).find(key => {
      const keyParts = key.split(' ');
      return keyParts.every(part => reciterName.includes(part));
    });
    if (mapKey) candidates.push(EVERY_AYAH_MAPPING[mapKey]);

    if (candidates.length === 0) {
        setErrorMessage('عذراً، لا يمكن تحديد مصدر ملفات الآيات لهذا القارئ.');
        setStatus('error');
        return;
    }

    let workingKey: string | null = null;
    
    for (const key of candidates) {
       const exists = await checkAyahExists(key, surah.id, start);
       if (exists) {
         workingKey = key;
         break;
       }
    }

    if (!workingKey) {
        setErrorMessage('عذراً، خدمة تقسيم الآيات غير متوفرة لهذا القارئ حالياً (الملفات المصدرية غير موجودة).');
        setStatus('error');
        return;
    }

    setStatus('downloading');
    const blobs: Blob[] = [];
    const total = end - start + 1;

    try {
      for (let i = start; i <= end; i++) {
        const blob = await fetchAyahBlob(workingKey, surah.id, i);
        blobs.push(blob);
        setProgress(Math.round(((i - start + 1) / total) * 100));
      }

      setStatus('processing');
      const finalBlob = concatBlobs(blobs);
      const downloadUrl = URL.createObjectURL(finalBlob);
      triggerDownload(downloadUrl, `Surah_${surah.englishName}_${start}-${end}_${reciter.name}.mp3`);
      setStatus('done');

    } catch (e: any) {
      console.error(e);
      if (e.message === 'AYAH_NOT_FOUND' || (e.message && e.message.includes('404'))) {
        setErrorMessage('حدث خطأ أثناء تحميل بعض الآيات. المصدر غير مكتمل.');
      } else if (e.message && e.message.includes('fetch failed')) {
         setErrorMessage('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
      } else {
        setErrorMessage(`خطأ: ${e.message || 'فشل تحميل الآيات.'}`);
      }
      setStatus('error');
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-800/50 border-b border-emerald-100 dark:border-emerald-700">
          <h3 className="font-serif text-xl text-emerald-800 dark:text-gold-400">تحميل سورة {surah.name}</h3>
          <button onClick={onClose} className="text-emerald-500 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-emerald-100 dark:bg-emerald-950/50 p-1 rounded-lg">
            <button
              onClick={() => setMode('full')}
              className={`flex-1 py-2 rounded-md transition-all font-bold text-sm ${mode === 'full' ? 'bg-emerald-600 dark:bg-gold-500 text-white shadow-lg' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800'}`}
            >
              السورة كاملة
            </button>
            <button
              onClick={() => supportsRange && setMode('range')}
              disabled={!supportsRange}
              className={`flex-1 py-2 rounded-md transition-all font-bold text-sm 
                ${mode === 'range' ? 'bg-emerald-600 dark:bg-gold-500 text-white shadow-lg' : supportsRange ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800' : 'text-emerald-400 dark:text-emerald-600 cursor-not-allowed opacity-50'}
              `}
              title={!supportsRange ? 'هذا القارئ لا يدعم تقسيم الآيات' : ''}
            >
              مقطع محدد
              {!supportsRange && <span className="block text-[10px] font-normal">غير متاح</span>}
            </button>
          </div>

          {/* Full Download View */}
          {mode === 'full' && (
            <div className="text-center py-4 space-y-4">
               <p className="text-emerald-700 dark:text-emerald-200">تحميل السورة كاملة بصيغة MP3</p>
               <p className="text-sm text-emerald-500 dark:text-emerald-400">القارئ: {reciter.name}</p>
               
               {status === 'idle' && (
                 <button 
                  onClick={handleFullDownload}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50"
                 >
                   <Download size={20} /> بدء التحميل
                 </button>
               )}
            </div>
          )}

          {/* Range Download View */}
          {mode === 'range' && supportsRange && (
            <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-emerald-600 dark:text-emerald-400">من الآية</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={surah.ayahCount}
                        value={startAyah}
                        onChange={(e) => setStartAyah(e.target.value)}
                        className="w-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-center text-emerald-900 dark:text-white focus:border-emerald-500 dark:focus:border-gold-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-emerald-600 dark:text-emerald-400">إلى الآية</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={surah.ayahCount}
                        value={endAyah}
                        onChange={(e) => setEndAyah(e.target.value)}
                        className="w-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-center text-emerald-900 dark:text-white focus:border-emerald-500 dark:focus:border-gold-500 outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-center text-xs text-emerald-500 dark:text-emerald-400 mt-2">عدد الآيات: {surah.ayahCount}</p>
                  
                  {status === 'idle' && (
                    <button 
                      onClick={handleRangeDownload}
                      className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50"
                    >
                      <Download size={20} /> تحميل المقطع
                    </button>
                  )}
            </div>
          )}

          {/* Status Indicators */}
          {(status === 'downloading' || status === 'processing' || status === 'verifying') && (
            <div className="mt-6 text-center space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-emerald-600 dark:text-gold-500" />
              <p className="text-emerald-700 dark:text-emerald-200">
                {status === 'verifying' ? 'جارٍ التحقق من توفر الملفات...' : 
                 status === 'downloading' ? (mode === 'range' ? `جارٍ تحميل الآيات... ${progress}%` : 'جارٍ التحميل...') : 
                 'جارٍ تجميع الملف الصوتي...'}
              </p>
              <div className="w-full h-2 bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 dark:bg-gold-500 transition-all duration-300"
                  style={{ width: mode === 'range' && status === 'downloading' ? `${progress}%` : (status === 'verifying' ? '25%' : (status === 'downloading' ? '50%' : '100%')) }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
             <div className="mt-6 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                  <CheckCircle size={32} />
                </div>
                <p className="text-green-700 dark:text-green-300 font-bold">تم التحميل بنجاح!</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="text-sm text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-800 dark:hover:text-white"
                >
                  تحميل ملف آخر
                </button>
             </div>
          )}

          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm text-center">
              {errorMessage}
              <button onClick={() => setStatus('idle')} className="block mx-auto mt-2 text-emerald-700 dark:text-white font-bold underline">إعادة المحاولة</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DownloadModal;