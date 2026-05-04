'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Music2, Play, Pause, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  title: string;
  artist: string;
  src: string;
}

const ElevatorTracks: Track[] = [
  {
    id: 1,
    title: "Bossa Nova Background",
    artist: "music_for_video",
    src: "/music_for_video-elevator-music-bossa-nova-background-music-version-60s-10900.mp3"
  },
  {
    id: 2,
    title: "Lounge Jazz Vibe",
    artist: "STAROSTIN",
    src: "/starostin-lounge-jazz-elevator-music-489965.mp3"
  },
  {
    id: 3,
    title: "Elevator Jazz Lounge",
    artist: "ikoliks_aj",
    src: "/ikoliks_aj-jazz-lounge-elevator-music-332339.mp3"
  }
];

interface RecordPlayerProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export const RecordPlayer: React.FC<RecordPlayerProps> = ({
  isPlaying,
  onToggle,
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = ElevatorTracks[currentTrackIndex];

  const nextTrack = useCallback(() => {
    setIsChangingTrack(true);
    setTimeout(() => {
      setCurrentTrackIndex(prev => (prev + 1) % ElevatorTracks.length);
      setIsChangingTrack(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Attempt play immediately. If it fails (e.g. NotSupportedError in Safari),
      // the onCanPlay/onLoadedData event handlers on the <audio> element will retry.
      audioRef.current.play().catch(error => {
        console.warn("Immediate play attempt failed, will retry on media ready:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack.src]);

  const handlePlayPause = () => {
    onToggle();
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    nextTrack();
  };

  const handleMediaReady = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.warn("Retry playback on media ready failed:", error);
      });
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-8 group">
      <audio 
        ref={audioRef}
        src={currentTrack.src}
        onEnded={nextTrack}
        onCanPlay={handleMediaReady}
        onLoadedData={handleMediaReady}
        preload="auto"
        playsInline
      />
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
        {/* Record Player Base */}
        <div className="absolute inset-0 bg-[#1a1a1a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
          <div className="absolute inset-4 bg-[#111] rounded-2xl border border-white/5 shadow-inner" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-zinc-800 rounded-full border border-white/5 shadow-2xl" />
        </div>

        {/* Vinyl Record with Animation */}
        <motion.div
          animate={{ rotate: isPlaying && !isChangingTrack ? 360 : 0 }}
          transition={{
            repeat: isPlaying && !isChangingTrack ? Infinity : 0,
            duration: 4,
            ease: "linear",
          }}
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[85%] bg-[#080808] rounded-full shadow-2xl flex items-center justify-center overflow-hidden",
            "after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_center,transparent_40%,rgba(255,255,255,0.05)_42%,transparent_44%)]",
            "before:absolute before:inset-0 before:rounded-full before:bg-[repeating-radial-gradient(circle_at_center,#000_0px,#000_1px,#111_2px,#111_3px)] before:opacity-30"
          )}
        >
          <AnimatePresence mode="wait">
            {!isChangingTrack ? (
              <motion.div
                key={currentTrack.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#111] overflow-hidden z-10 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-[#111]" />
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#000] rounded-full shadow-inner border border-white/10 z-20" />
                <div className="absolute inset-0 rounded-full border border-white/5 z-20 pointer-events-none" />
              </motion.div>
            ) : (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#111] overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 z-10 flex items-center justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#000] rounded-full shadow-inner border border-white/10" />
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tonearm */}
        <motion.div
          initial={{ rotate: -25 }}
          animate={{ rotate: isPlaying ? 12 : -25 }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className="absolute top-4 right-12 w-8 h-48 origin-top z-20 pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-zinc-700 rounded-full border border-white/10 shadow-lg" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-44 bg-gradient-to-b from-zinc-400 to-zinc-600 rounded-full shadow-md">
            <div className="absolute -bottom-4 -left-2 w-6 h-10 bg-zinc-800 rounded-sm shadow-md border border-white/5 origin-top rotate-12 flex items-center justify-center">
              <div className="w-0.5 h-4 bg-zinc-400 mt-4" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toggle Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-full",
              isPlaying 
              ? "bg-white text-black" 
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            <span className="text-sm font-bold uppercase tracking-widest">
              {isPlaying ? "Pause" : "Play"}
            </span>
          </button>

          <button
            onClick={handleSkip}
            className={cn(
              "flex items-center justify-center size-14 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
              isChangingTrack && "pointer-events-none opacity-50"
            )}
          >
            <SkipForward size={22} />
          </button>
        </div>

        {/* Track Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTrack.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-white/80">
              {currentTrack.title}
            </span>
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {currentTrack.artist}
            </span>
            <div className="flex gap-2 mt-2">
              {ElevatorTracks.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    idx === currentTrackIndex ? "bg-white" : "bg-white/20"
                  )}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};