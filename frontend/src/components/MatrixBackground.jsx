import { useEffect, useRef } from 'react';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]=/\\|';

const THEMES = {
  classic: {
    head: 'rgba(180, 255, 180, 0.9)',
    trail: (b) => `rgba(0, ${Math.floor(150 + b * 105)}, 0, `,
    flash: 'rgba(255, 255, 255, ',
    bg: 'rgba(0, 0, 0, 0.05)',
  },
  neon: {
    head: 'rgba(255, 140, 255, 0.95)',
    trail: (b) => `rgba(${Math.floor(120 + b * 80)}, 0, ${Math.floor(180 + b * 75)}, `,
    flash: 'rgba(255, 200, 255, ',
    bg: 'rgba(5, 0, 15, 0.05)',
  },
  pink: {
    head: 'rgba(255, 180, 220, 0.95)',
    trail: (b) => `rgba(${Math.floor(200 + b * 55)}, ${Math.floor(50 + b * 40)}, ${Math.floor(120 + b * 60)}, `,
    flash: 'rgba(255, 230, 245, ',
    bg: 'rgba(15, 0, 5, 0.05)',
  },
};

export default function MatrixBackground({ theme = 'classic' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const colors = THEMES[theme] || THEMES.classic;

    let w, h, columns, drops, speeds, brightnesses;
    const fontSize = 14;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      columns = Math.floor(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -100);
      speeds = Array.from({ length: columns }, () => 0.3 + Math.random() * 0.7);
      brightnesses = Array.from({ length: columns }, () => Math.random());
    }

    resize();
    window.addEventListener('resize', resize);

    let animFrame;

    function draw() {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px "Courier New", monospace`;

      for (let i = 0; i < columns; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const b = brightnesses[i];

        // Head
        ctx.fillStyle = colors.head;
        ctx.fillText(char, x, y);

        // Trail
        for (let t = 1; t < 18; t++) {
          const trailY = y - t * fontSize;
          if (trailY < 0) break;
          const trailChar = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const alpha = Math.max(0, (1 - t / 18) * b * 0.5);
          if (Math.random() < 0.008) {
            ctx.fillStyle = colors.flash + (alpha * 1.5) + ')';
          } else {
            ctx.fillStyle = colors.trail(b) + alpha + ')';
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

      animFrame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.15 }}
    />
  );
}
