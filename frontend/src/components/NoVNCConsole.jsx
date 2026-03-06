import { useEffect, useRef } from 'react';

export default function NoVNCConsole({ wsUrl, token, onConnect, onDisconnect }) {
  const containerRef = useRef(null);
  const rfbRef = useRef(null);

  useEffect(() => {
    if (!wsUrl || !token) return;

    let rfb = null;

    async function init() {
      const RFB = (await import('@novnc/novnc/lib/rfb')).default;
      rfb = new RFB(containerRef.current, `${wsUrl}?token=${token}`, {
        wsProtocols: ['binary'],
      });
      rfbRef.current = rfb;
      rfb.scaleViewport = true;
      rfb.resizeSession = true;
      rfb.addEventListener('connect', () => onConnect?.());
      rfb.addEventListener('disconnect', () => onDisconnect?.());
    }

    init();

    return () => {
      if (rfb) rfb.disconnect();
    };
  }, [wsUrl, token]);

  return <div ref={containerRef} className="w-full h-full" />;
}
