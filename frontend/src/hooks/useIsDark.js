import { useState, useEffect } from 'react';

export default function useIsDark() {
  const [dark, setDark] = useState(() => {
    try { const t = localStorage.getItem('cc-matrix-theme'); return !!t && t !== 'off'; } catch { return false; }
  });
  useEffect(() => {
    const handler = () => {
      try { const t = localStorage.getItem('cc-matrix-theme'); setDark(!!t && t !== 'off'); } catch {}
    };
    window.addEventListener('storage', handler);
    const interval = setInterval(handler, 1000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);
  return dark;
}
