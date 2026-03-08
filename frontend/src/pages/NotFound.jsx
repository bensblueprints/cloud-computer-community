import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]=/\\|~`!@#$%^&*()_+-';
const GLITCH_WORDS = ['404', 'NOT FOUND', 'ERROR', 'NULL', 'VOID', 'LOST', '???', '0x1A4', 'MISSING', 'GONE'];

export default function NotFound() {
  const canvasRef = useRef(null);
  const [glitchText, setGlitchText] = useState('404');
  const [subGlitch, setSubGlitch] = useState('PAGE NOT FOUND');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let w, h, columns, drops, speeds, brightnesses;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const fontSize = 14;
      columns = Math.floor(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
      speeds = Array.from({ length: columns }, () => 0.3 + Math.random() * 0.7);
      brightnesses = Array.from({ length: columns }, () => Math.random());
    }

    resize();
    window.addEventListener('resize', resize);

    let animFrame;
    let time = 0;

    function draw() {
      time++;

      // Fade trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, w, h);

      const fontSize = 14;

      for (let i = 0; i < columns; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary green intensity per column
        const b = brightnesses[i];
        const isHead = true;

        // Head character (bright white-green)
        ctx.font = `${fontSize}px "Courier New", monospace`;
        ctx.fillStyle = `rgba(180, 255, 180, ${0.9 + Math.random() * 0.1})`;
        ctx.fillText(char, x, y);

        // Trail characters (dimmer green)
        for (let t = 1; t < 20; t++) {
          const trailY = y - t * fontSize;
          if (trailY < 0) break;
          const trailChar = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const alpha = Math.max(0, (1 - t / 20) * b * 0.6);
          const g = Math.floor(150 + b * 105);
          ctx.fillStyle = `rgba(0, ${g}, 0, ${alpha})`;
          // Occasionally glitch a trail character
          if (Math.random() < 0.01) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
          }
          ctx.fillText(trailChar, x, trailY);
        }

        drops[i] += speeds[i];

        if (drops[i] * fontSize > h && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
          speeds[i] = 0.3 + Math.random() * 0.7;
          brightnesses[i] = Math.random();
        }
      }

      // Scanline effect
      if (time % 3 === 0) {
        for (let sy = 0; sy < h; sy += 4) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
          ctx.fillRect(0, sy, w, 1);
        }
      }

      // Random glitch blocks
      if (Math.random() < 0.03) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const gw = 50 + Math.random() * 200;
        const gh = 2 + Math.random() * 10;
        ctx.fillStyle = `rgba(0, ${150 + Math.random() * 105}, 0, ${0.1 + Math.random() * 0.2})`;
        ctx.fillRect(gx, gy, gw, gh);
      }

      // Horizontal glitch displacement
      if (Math.random() < 0.01) {
        const sliceY = Math.random() * h;
        const sliceH = 5 + Math.random() * 30;
        const shift = (Math.random() - 0.5) * 40;
        const imgData = ctx.getImageData(0, sliceY, w, sliceH);
        ctx.putImageData(imgData, shift, sliceY);
      }

      animFrame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  // Glitch text effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const word = GLITCH_WORDS[Math.floor(Math.random() * GLITCH_WORDS.length)];
        setGlitchText(word);
        setTimeout(() => setGlitchText('404'), 150);
      }
      if (Math.random() < 0.2) {
        const chars = 'PAGE NOT FOUND'.split('');
        const glitched = chars.map(c =>
          Math.random() < 0.3 ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)] : c
        ).join('');
        setSubGlitch(glitched);
        setTimeout(() => setSubGlitch('PAGE NOT FOUND'), 100);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black cursor-default select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* CRT overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 3px)',
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Glowing 404 */}
        <h1
          className="font-mono font-bold tracking-widest mb-2 text-center"
          style={{
            fontSize: 'clamp(80px, 15vw, 180px)',
            color: '#00ff41',
            textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 80px #008f11, 0 0 120px #003b00',
            animation: 'flicker 3s infinite alternate',
          }}
        >
          {glitchText}
        </h1>

        <p
          className="font-mono text-lg sm:text-2xl tracking-[0.3em] mb-8 text-center"
          style={{
            color: '#00cc33',
            textShadow: '0 0 5px #00ff41, 0 0 15px #00ff41',
          }}
        >
          {subGlitch}
        </p>

        {/* Terminal-style message */}
        <div
          className="bg-black/60 border border-green-900 rounded-lg p-6 max-w-lg w-full backdrop-blur-sm mb-8"
          style={{ boxShadow: '0 0 15px rgba(0, 255, 65, 0.1), inset 0 0 15px rgba(0, 255, 65, 0.05)' }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-900/50">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs font-mono text-green-700">cloudcode@terminal</span>
          </div>
          <div className="font-mono text-sm space-y-1.5">
            <p style={{ color: '#00ff41' }}>
              <span className="text-green-700">$</span> locate requested_page
            </p>
            <p className="text-red-400">
              Error: No match found in /cloudcode.space/*
            </p>
            <p style={{ color: '#00ff41' }}>
              <span className="text-green-700">$</span> echo $?
            </p>
            <p className="text-green-300">404</p>
            <p style={{ color: '#00ff41' }}>
              <span className="text-green-700">$</span> suggest --fix
            </p>
            <p className="text-green-300/80">
              Redirecting to known coordinates...
            </p>
            <p style={{ color: '#00ff41' }} className="animate-pulse">
              <span className="text-green-700">$</span> <span className="border-r-2 border-green-500">_</span>
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="group relative px-8 py-3 font-mono font-bold text-sm tracking-wider border-2 border-green-500 text-green-400 rounded-lg overflow-hidden transition-all duration-300 hover:text-black hover:border-green-400"
          >
            <span className="absolute inset-0 bg-green-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10">[ HOME ]</span>
          </Link>
          <Link
            to="/dashboard"
            className="group relative px-8 py-3 font-mono font-bold text-sm tracking-wider border-2 border-green-500 text-green-400 rounded-lg overflow-hidden transition-all duration-300 hover:text-black hover:border-green-400"
          >
            <span className="absolute inset-0 bg-green-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10">[ DASHBOARD ]</span>
          </Link>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            opacity: 1;
          }
          20%, 24%, 55% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
