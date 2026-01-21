import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Loader2, Copy, Check } from 'lucide-react';
import { Surah, SurahDetails } from '../types';
import { fetchSurahText } from '../services/quranService';

interface QuranDrawerProps {
  surah: Surah;
  isOpen: boolean;
  onClose: () => void;
  isPlayerVisible: boolean;
}

const QuranDrawer: React.FC<QuranDrawerProps> = ({ surah, isOpen, onClose, isPlayerVisible }) => {
  const [data, setData] = useState<SurahDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && surah) {
      if (data?.number !== surah.id) {
        setLoading(true);
        fetchSurahText(surah.id).then((result) => {
          setData(result);
          setLoading(false);
        });
      }
    }
  }, [surah, isOpen, data]);

  const handleAyahClick = (ayahNumber: number) => {
      setActiveAyah(ayahNumber);
  };

  const copyAyahText = (text: string) => {
      if (activeAyah) {
          navigator.clipboard.writeText(text).then(() => {
              setCopiedAyah(activeAyah);
              setTimeout(() => setCopiedAyah(null), 2000);
          });
      }
  };

  if (!isOpen) return null;

  const BASMALAH_HEADER = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-[45] bg-white dark:bg-emerald-950 border-t border-emerald-200 dark:border-gold-500/30 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ height: '85vh', maxHeight: '85vh' }}
    >
      {/* Header / Handle */}
      <div 
        className="flex flex-col items-center justify-center pt-3 pb-2 cursor-pointer bg-emerald-50 dark:bg-emerald-900/50 rounded-t-3xl border-b border-emerald-100 dark:border-emerald-800/50"
        onClick={onClose}
      >
        <div className="w-12 h-1.5 bg-emerald-300 dark:bg-emerald-700/50 rounded-full mb-2"></div>
        <div className="flex items-center justify-between w-full px-6">
            <h2 className="text-xl font-serif text-emerald-800 dark:text-gold-400">سورة {surah.name}</h2>
            <button onClick={onClose} className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700 text-emerald-600 dark:text-emerald-200">
                <ChevronDown size={20} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-full overflow-y-auto pb-32 px-4 md:px-8 scroll-smooth" ref={contentRef}>
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-emerald-500 dark:text-emerald-400">
                <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-gold-500" />
                <p>جاري تحميل الآيات...</p>
            </div>
        ) : data ? (
            <div className="max-w-3xl mx-auto py-8">
                {surah.id !== 9 && surah.id !== 1 && (
                    <div className="text-center mb-8 font-serif text-2xl md:text-3xl text-emerald-800 dark:text-emerald-200 opacity-80">
                        {BASMALAH_HEADER}
                    </div>
                )}

                <div className="text-justify leading-[3] md:leading-[3.5] text-xl md:text-3xl font-serif" dir="rtl">
                    {data.ayahs.map((ayah, index) => {
                        let textToDisplay = ayah.text;

                        if (ayah.numberInSurah === 1 && surah.id !== 1 && surah.id !== 9) {
                            textToDisplay = textToDisplay.replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/u, '').trim();
                        }

                        return (
                          <span 
                              key={ayah.number}
                              onClick={() => handleAyahClick(ayah.numberInSurah)}
                              className={`
                                  inline cursor-pointer transition-colors duration-200 px-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-800/30
                                  ${activeAyah === ayah.numberInSurah ? 'text-emerald-900 dark:text-gold-400 bg-emerald-200 dark:bg-emerald-900/60 shadow-sm' : 'text-emerald-900 dark:text-white'}
                              `}
                          >
                              {textToDisplay}
                              <span className="text-emerald-700 dark:text-gold-500 mx-2 text-lg inline-flex items-center justify-center border border-emerald-300 dark:border-emerald-700 rounded-full w-8 h-8 md:w-10 md:h-10 text-sm md:text-base align-middle bg-emerald-100 dark:bg-emerald-900/40 select-none">
                                  {ayah.numberInSurah.toLocaleString('ar-EG')}
                              </span>
                          </span>
                        );
                    })}
                </div>
                
                <div className="mt-12 text-center text-emerald-600 dark:text-emerald-500 text-sm">
                    صدق الله العظيم
                </div>
            </div>
        ) : (
            <div className="text-center py-20 text-red-500 dark:text-red-400">
                فشل تحميل النص. يرجى التحقق من الاتصال.
            </div>
        )}
      </div>

      {/* Floating Action Bar for Selected Ayah */}
      {/* Position dynamically adjusted based on isPlayerVisible */}
      {activeAyah && data && (
          <div className={`fixed left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in-up transition-all duration-300 ${isPlayerVisible ? 'bottom-80' : 'bottom-36'}`}>
              <div className="flex items-center gap-2 bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white px-4 py-2 rounded-full shadow-xl border border-emerald-200 dark:border-emerald-600">
                  <span className="text-sm font-bold text-emerald-700 dark:text-gold-400 px-2 border-l border-emerald-200 dark:border-emerald-600">
                      الآية {activeAyah}
                  </span>
                  <button 
                    onClick={() => {
                         const ayah = data.ayahs.find(a => a.numberInSurah === activeAyah);
                         if (ayah) copyAyahText(ayah.text);
                    }}
                    className="flex items-center gap-2 px-3 py-1 hover:bg-emerald-100 dark:hover:bg-emerald-700 rounded-full transition-colors"
                  >
                      {copiedAyah === activeAyah ? (
                          <>
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-600 dark:text-green-400">تم النسخ</span>
                          </>
                      ) : (
                          <>
                            <Copy size={16} />
                            <span className="text-sm">نسخ النص</span>
                          </>
                      )}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default QuranDrawer;