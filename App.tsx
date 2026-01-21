import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, Music, BookOpen, AlertCircle, Layers, FileAudio, Sun, Moon } from 'lucide-react';
import { Reciter, Surah, ViewState } from './types';
import { SURAH_LIST } from './constants';
import { fetchReciters, isLikelyRangeSupported } from './services/quranService';
import Player from './components/Player';
import DownloadModal from './components/DownloadModal';
import QuranDrawer from './components/QuranDrawer';

type ReciterFilterMode = 'all' | 'range';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.RECITERS);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  
  // Browsing State
  const [browsingReciter, setBrowsingReciter] = useState<Reciter | null>(null);
  
  // Playback State
  const [playingReciter, setPlayingReciter] = useState<Reciter | null>(null);
  const [playingSurah, setPlayingSurah] = useState<Surah | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showQuranDrawer, setShowQuranDrawer] = useState(false);
  
  const [filterMode, setFilterMode] = useState<ReciterFilterMode>('all');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const loadReciters = async () => {
      setLoading(true);
      const data = await fetchReciters();
      setReciters(data);
      setLoading(false);
    };
    loadReciters();
  }, []);

  const handleReciterClick = (reciter: Reciter) => {
    setBrowsingReciter(reciter);
    setView(ViewState.SURAHS);
    setSearchQuery('');
  };

  const handleSurahClick = (surah: Surah) => {
    if (browsingReciter) {
      setPlayingReciter(browsingReciter);
      setPlayingSurah(surah);
    }
  };

  const goBack = () => {
    if (view === ViewState.SURAHS) {
      setView(ViewState.RECITERS);
      setBrowsingReciter(null);
      setSearchQuery('');
    }
  };

  const filteredReciters = useMemo(() => {
    let list = reciters;

    if (filterMode === 'range') {
      list = list.filter(r => isLikelyRangeSupported(r));
    }

    if (!searchQuery) return list;
    return list.filter(r => r.name.includes(searchQuery) || r.letter.includes(searchQuery));
  }, [reciters, searchQuery, filterMode]);

  const filteredSurahs = useMemo(() => {
    if (!browsingReciter) return [];
    const availableIds = browsingReciter.suras.split(',').map(s => parseInt(s.trim()));
    const availableSurahs = SURAH_LIST.filter(s => availableIds.includes(s.id));
    
    if (!searchQuery) return availableSurahs;
    return availableSurahs.filter(s => 
      s.name.includes(searchQuery) || 
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.id.toString() === searchQuery
    );
  }, [browsingReciter, searchQuery]);

  const activeReciterContext = browsingReciter || playingReciter;
  const activeSurahContext = playingSurah;

  return (
    <div className={`min-h-screen pb-32 font-sans transition-colors duration-300 ${isDarkMode ? "bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-fixed" : "bg-emerald-50"}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-emerald-950/90 backdrop-blur-md border-b border-emerald-200 dark:border-emerald-800 shadow-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {view === ViewState.SURAHS && (
                <button 
                  onClick={goBack}
                  className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-600 dark:text-gold-500 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-serif font-bold text-emerald-800 dark:text-gold-500 tracking-wide drop-shadow-sm">
                  {view === ViewState.SURAHS && browsingReciter ? browsingReciter.name : 'قصر القرآن'}
                </h1>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-serif opacity-80">
                  {view === ViewState.SURAHS ? 'قائمة السور المتاحة' : 'اختر القارئ المفضل لديك'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-gold-400 hover:bg-emerald-200 dark:hover:bg-emerald-800"
                    title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
                 >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
                 <div className="w-10 h-10 bg-emerald-600 dark:bg-gold-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/20 dark:shadow-gold-500/20">
                    <BookOpen size={20} className="text-white dark:text-emerald-900" />
                 </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={view === ViewState.RECITERS ? "ابحث عن قارئ..." : "ابحث عن سورة..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-emerald-100/50 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-white placeholder-emerald-500 dark:placeholder-emerald-500 rounded-xl py-3 px-12 focus:outline-none focus:border-emerald-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-gold-500 transition-all"
            />
            <Search className="absolute right-4 top-3.5 text-emerald-500" size={20} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 gap-4 text-emerald-400">
             <div className="w-12 h-12 border-4 border-emerald-600 dark:border-gold-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="animate-pulse">جاري تحميل القراء...</p>
           </div>
        ) : (
          <>
            {/* Sections / Tabs for Reciters */}
            {view === ViewState.RECITERS && (
              <>
                <div className="flex p-1 bg-emerald-200/50 dark:bg-emerald-900/50 rounded-xl mb-6 gap-1 border border-emerald-300 dark:border-emerald-800">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                      filterMode === 'all' 
                      ? 'bg-emerald-600 dark:bg-gold-500 text-white dark:text-emerald-950 shadow-lg' 
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-300 dark:hover:bg-emerald-800'
                    }`}
                  >
                    <Layers size={18} />
                    <span>تنزيل السورة كاملة</span>
                  </button>
                  <button
                    onClick={() => setFilterMode('range')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                      filterMode === 'range' 
                      ? 'bg-emerald-600 dark:bg-gold-500 text-white dark:text-emerald-950 shadow-lg' 
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-300 dark:hover:bg-emerald-800'
                    }`}
                  >
                    <FileAudio size={18} />
                    <span>تنزيل مقطع محدد</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredReciters.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-emerald-500 dark:text-emerald-400 opacity-60">
                      <p>لا يوجد قراء مطابقين في هذا القسم.</p>
                    </div>
                  ) : (
                    filteredReciters.map((reciter) => (
                      <div 
                        key={reciter.id}
                        onClick={() => handleReciterClick(reciter)}
                        className="bg-white dark:bg-gradient-to-br dark:from-emerald-900 dark:to-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-4 hover:border-emerald-500 dark:hover:border-gold-500/50 hover:shadow-lg hover:shadow-emerald-200 dark:hover:shadow-gold-900/20 hover:-translate-y-1 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-serif text-xl border border-emerald-200 dark:border-emerald-700 group-hover:border-emerald-500 dark:group-hover:border-gold-500 group-hover:text-emerald-800 dark:group-hover:text-gold-400 transition-colors">
                          {reciter.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-emerald-900 dark:text-emerald-100 truncate group-hover:text-emerald-700 dark:group-hover:text-white transition-colors">{reciter.name}</h3>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate mt-1">{reciter.rewaya}</p>
                        </div>
                        <div className="text-emerald-400 dark:text-emerald-600 group-hover:text-emerald-600 dark:group-hover:text-gold-500 transition-colors">
                          <ChevronLeft size={20} className="rotate-180" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Surahs List */}
            {view === ViewState.SURAHS && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSurahs.length === 0 ? (
                   <div className="col-span-full flex flex-col items-center justify-center py-12 text-emerald-500 dark:text-emerald-400 opacity-70">
                     <AlertCircle size={48} className="mb-2" />
                     <p>لا توجد سور مطابقة للبحث أو متاحة لهذا القارئ</p>
                   </div>
                ) : (
                  filteredSurahs.map((surah) => {
                    const isPlaying = playingSurah?.id === surah.id && playingReciter?.id === browsingReciter?.id;
                    
                    return (
                      <div 
                        key={surah.id}
                        onClick={() => handleSurahClick(surah)}
                        className={`
                          relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-300
                          ${isPlaying
                            ? 'bg-emerald-600 dark:bg-gold-500 text-white dark:text-emerald-950 border-emerald-600 dark:border-gold-400 shadow-lg scale-[1.02]' 
                            : 'bg-white dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between z-10 relative">
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center font-serif font-bold text-sm
                              ${isPlaying ? 'bg-emerald-700 dark:bg-emerald-900 text-emerald-100 dark:text-gold-500' : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'}
                            `}>
                              {surah.id}
                            </div>
                            <div>
                              <h4 className={`font-bold text-lg font-serif ${isPlaying ? 'text-white dark:text-emerald-950' : 'text-emerald-900 dark:text-emerald-100'}`}>
                                {surah.name}
                              </h4>
                              <p className={`text-xs ${isPlaying ? 'text-emerald-100 dark:text-emerald-800' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {surah.englishName} • {surah.ayahCount} آية
                              </p>
                            </div>
                          </div>
                          {isPlaying && (
                            <div className="animate-pulse text-white dark:text-emerald-900">
                              <Music size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Audio Player */}
      <Player 
        reciter={playingReciter} 
        surah={playingSurah} 
        onDownloadClick={() => setShowDownloadModal(true)}
        onReadClick={() => setShowQuranDrawer(!showQuranDrawer)}
        isReadingMode={showQuranDrawer}
        isVisible={isPlayerVisible}
        onVisibilityChange={setIsPlayerVisible}
      />

      {/* Download Modal */}
      {showDownloadModal && activeReciterContext && activeSurahContext && (
        <DownloadModal 
          reciter={activeReciterContext}
          surah={activeSurahContext}
          onClose={() => setShowDownloadModal(false)}
        />
      )}

      {/* Quran Text Drawer */}
      {activeSurahContext && (
        <QuranDrawer 
          surah={activeSurahContext}
          isOpen={showQuranDrawer}
          onClose={() => setShowQuranDrawer(false)}
          isPlayerVisible={isPlayerVisible}
        />
      )}
    </div>
  );
};

export default App;