import { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

const TRACKS = [
  { name: 'Lofi Chill', file: '/music/lofi-chill-0.mp3' },
  { name: 'Ambient Focus', file: '/music/lofi-chill-1.mp3' },
];

export default function MusicPlayer({ dark }) {
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(() => {
    try { return parseFloat(localStorage.getItem('cc-music-vol')) || 0.4; } catch { return 0.4; }
  });
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef(null);
  const progressInterval = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.loop = false;
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      const next = (currentTrack + 1) % TRACKS.length;
      setCurrentTrack(next);
      audio.src = TRACKS[next].file;
      audio.play().catch(() => {});
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = TRACKS[currentTrack].file;
    if (playing) audioRef.current.play().catch(() => {});
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
    try { localStorage.setItem('cc-music-vol', volume.toString()); } catch {}
  }, [volume, muted]);

  useEffect(() => {
    if (playing) {
      progressInterval.current = setInterval(() => {
        const a = audioRef.current;
        if (a && a.duration) setProgress((a.currentTime / a.duration) * 100);
      }, 500);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [playing]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      if (!a.src || a.src === window.location.href) a.src = TRACKS[currentTrack].file;
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const skipNext = () => {
    const next = (currentTrack + 1) % TRACKS.length;
    setCurrentTrack(next);
    setProgress(0);
  };

  const toggleMute = () => setMuted(!muted);

  return (
    <div className="relative" ref={containerRef}>
      {/* Toggle button - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`p-2 rounded-lg transition ${dark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        title="Music Player"
      >
        <Music className={`w-4 h-4 ${playing ? 'text-purple-500 animate-pulse' : ''}`} />
      </button>

      {/* Dropdown panel - absolute positioned */}
      {expanded && (
        <div
          className={`absolute right-0 top-full mt-2 rounded-xl border p-3 w-64 ${dark ? 'bg-gray-900/95 backdrop-blur border-gray-700' : 'bg-white border-gray-200 shadow-xl'}`}
          style={{ zIndex: 9999 }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Music className={`w-3.5 h-3.5 ${playing ? 'text-purple-500' : dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium truncate max-w-[140px] ${dark ? 'text-gray-200' : 'text-gray-700'}`}>
                {TRACKS[currentTrack].name}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className={`text-xs px-1 ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              &times;
            </button>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-1 rounded-full mb-2 ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <button
                onClick={skipNext}
                className={`p-1.5 rounded transition ${dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className={`p-1 rounded transition ${dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="w-16 h-1 accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
