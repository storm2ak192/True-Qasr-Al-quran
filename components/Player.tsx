import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, Download, Loader2, BookOpenText, ChevronDown, ChevronUp, ChevronsUp, X } from 'lucide-react';
import { Reciter, Surah } from '../types';
import { getSurahAudioUrl } from '../services/quranService';

interface PlayerProps {
  reciter: Reciter | null;
  surah: Surah | null;
  onPrev?: () => void;
  onNext?: () => void;
  onDownloadClick: () => void;
  onReadClick: () => void;
  isReadingMode: boolean;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

const Player: React.FC<PlayerProps> = ({ reciter, surah, onDownloadClick, onReadClick, isReadingMode, isVisible, onVisibilityChange }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (reciter && surah && audioRef.current) {
      const url = getSurahAudioUrl(reciter.server, surah.id);
      
      const currentSrc = audioRef.current.src;
      if (!currentSrc.includes(url)) {
        audioRef.current.src = url;
        setIsLoading(true);
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          onVisibilityChange(true);
          setIsExpanded(true);
        }).catch(e => {
          console.error("Play failed", e);
          setIsLoading(false);
        });
      } else {
        if (audioRef.current.paused) {
             audioRef.current.play();
             setIsPlaying(true);
        }
      }
    }
  }, [reciter, surah, onVisibilityChange]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  if (!reciter || !surah) return null;

  return (
    <>
        <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
        />

        {/* Hidden State Trigger Button */}
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[48] transition-all duration-500 transform ${!isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
             <button 
                onClick={() => onVisibilityChange(true)}
                className="flex items-center gap-2 bg-emerald-600 dark:bg-gold-500 hover:bg-emerald-500 dark:hover:bg-gold-400 text-white dark:text-emerald-950 px-6 py-3 rounded-full shadow-lg shadow-emerald-600/20 dark:shadow-gold-500/20 font-bold animate-bounce-slight transition-colors"
             >
                <ChevronsUp size={20} />
                <span>إظهار المشغل</span>
             </button>
        </div>

        {/* Player Container */}
        <div className={`fixed bottom-4 left-0 right-0 z-[50] px-4 transition-all duration-500 pointer-events-none transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <div className={`
                max-w-4xl mx-auto backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] 
                rounded-2xl overflow-hidden transition-all duration-500 ease-in-out pointer-events-auto
                bg-white/95 dark:bg-emerald-950/95 border border-emerald-200 dark:border-emerald-700/50
                ${isExpanded ? 'p-4' : 'p-3'}
            `}>
                
                {/* Minimized View / Header */}
                <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`
                        rounded-lg flex items-center justify-center border shrink-0 transition-all
                        bg-emerald-100 dark:bg-emerald-800 border-emerald-200 dark:border-emerald-600
                        ${isExpanded ? 'w-12 h-12' : 'w-10 h-10'}
                    `}>
                    {isLoading ? (
                        <Loader2 size={isExpanded ? 20 : 16} className="animate-spin text-emerald-600 dark:text-gold-500" />
                    ) : (
                        <span className={`font-serif font-bold text-emerald-700 dark:text-gold-400 ${isExpanded ? 'text-lg' : 'text-sm'}`}>{surah.id}</span>
                    )}
                    </div>
                    
                    <div className="overflow-hidden min-w-0">
                    <h3 className={`font-bold font-serif truncate text-emerald-900 dark:text-gold-400 ${isExpanded ? 'text-lg' : 'text-sm'}`}>
                        {surah.name}
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 truncate opacity-80">{reciter.name}</p>
                    </div>
                </div>

                {!isExpanded && (
                    <div className="flex items-center gap-3 mr-4">
                        <button 
                        onClick={togglePlay} 
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors bg-emerald-600 dark:bg-gold-500 text-white dark:text-emerald-950 hover:bg-emerald-500 dark:hover:bg-gold-400"
                        >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1 mr-2">
                    <button 
                        className="p-1 text-emerald-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    >
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </button>
                    <button 
                         className="p-1 text-emerald-500 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                         onClick={(e) => { e.stopPropagation(); onVisibilityChange(false); }}
                         title="إخفاء المشغل"
                    >
                         <ChevronDown size={20} className="border border-current rounded-full p-0.5" />
                    </button>
                </div>
                </div>

                {/* Expanded Controls Section */}
                <div className={`
                    overflow-hidden transition-all duration-500 ease-in-out
                    ${isExpanded ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                `}>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 w-full text-xs text-emerald-600 dark:text-emerald-200 mb-4">
                        <span className="w-8 text-right">{formatTime(progress)}</span>
                        <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={progress}
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-emerald-200 dark:bg-emerald-800/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-600 dark:[&::-webkit-slider-thumb]:bg-gold-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                        />
                        <span className="w-8">{formatTime(duration)}</span>
                    </div>

                    {/* Main Controls Row */}
                    <div className="flex items-center justify-between">
                        
                        {/* Volume */}
                        <div className="hidden sm:flex items-center gap-2 w-1/4">
                            <Volume2 size={16} className="text-emerald-500 dark:text-emerald-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    if(audioRef.current) audioRef.current.volume = v;
                                }}
                                className="w-20 h-1 bg-emerald-200 dark:bg-emerald-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Play/Pause Button */}
                        <div className="flex justify-center w-full sm:w-2/4">
                            <button 
                            onClick={togglePlay} 
                            className="w-14 h-14 flex items-center justify-center rounded-full shadow-lg shadow-emerald-600/20 dark:shadow-gold-500/20 transition-all active:scale-95 bg-emerald-600 dark:bg-gold-500 text-white dark:text-emerald-950 hover:bg-emerald-500 dark:hover:bg-gold-600"
                            >
                            {isPlaying ? (
                                <Pause size={28} fill="currentColor" />
                            ) : (
                                <Play size={28} fill="currentColor" className="ml-1" />
                            )}
                            </button>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex items-center justify-end gap-3 w-1/4">
                            <button 
                                onClick={onReadClick}
                                className={`p-2 rounded-full transition-colors relative ${isReadingMode ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-gold-400' : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 hover:text-emerald-700 dark:hover:text-white'}`}
                                title="عرض نص السورة"
                            >
                                <BookOpenText size={20} />
                            </button>

                            <button 
                                onClick={onDownloadClick}
                                className="p-2 rounded-full text-emerald-500 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 hover:text-emerald-700 dark:hover:text-gold-400 transition-colors"
                                title="تحميل السورة"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </>
  );
};

export default Player;