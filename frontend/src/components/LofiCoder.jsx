export default function LofiCoder({ variant = 'green' }) {
  const colors = {
    green: { glow: '#00ff41', dim: '#003b00', skin: '#c4956a', hair: '#2d1b0e', monitor: '#001a00', code: '#00ff41', coffee: '#8B4513', desk: '#1a1a2e', wall: '#0d0d1a', window: '#0a1628', stars: '#ffffff', plant: '#00aa33' },
    pink: { glow: '#ff69b4', dim: '#4a0028', skin: '#e8b89d', hair: '#1a0a2e', monitor: '#1a000d', code: '#ff69b4', coffee: '#9e5c3a', desk: '#1e1028', wall: '#120a1e', window: '#14082a', stars: '#ffccee', plant: '#cc44aa' },
    purple: { glow: '#b36bff', dim: '#2a0050', skin: '#d4a085', hair: '#0d0d2e', monitor: '#0d001a', code: '#b36bff', coffee: '#7a4a2e', desk: '#160d2e', wall: '#0e0818', window: '#0e0628', stars: '#ddbbff', plant: '#8844cc' },
  };
  const c = colors[variant] || colors.green;

  return (
    <div className="fixed bottom-0 right-0 pointer-events-none select-none" style={{ zIndex: 1, opacity: 0.12, width: '420px', height: '350px' }}>
      <svg viewBox="0 0 420 350" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <filter id="lofi-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Room / Wall */}
        <rect x="0" y="0" width="420" height="350" fill={c.wall} />

        {/* Window */}
        <rect x="280" y="30" width="110" height="80" rx="3" fill={c.window} stroke={c.dim} strokeWidth="2" />
        <line x1="335" y1="30" x2="335" y2="110" stroke={c.dim} strokeWidth="1.5" />
        <line x1="280" y1="70" x2="390" y2="70" stroke={c.dim} strokeWidth="1.5" />
        {/* Stars */}
        <circle cx="300" cy="50" r="1.5" fill={c.stars} opacity="0.8"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" /></circle>
        <circle cx="330" cy="42" r="1" fill={c.stars} opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="4s" repeatCount="indefinite" /></circle>
        <circle cx="355" cy="55" r="1.2" fill={c.stars} opacity="0.7"><animate attributeName="opacity" values="0.7;0.15;0.7" dur="2.5s" repeatCount="indefinite" /></circle>
        <circle cx="310" cy="90" r="1" fill={c.stars} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="5s" repeatCount="indefinite" /></circle>
        <circle cx="370" cy="45" r="0.8" fill={c.stars} opacity="0.6"><animate attributeName="opacity" values="0.6;0.05;0.6" dur="3.5s" repeatCount="indefinite" /></circle>
        {/* Moon */}
        <circle cx="360" cy="52" r="8" fill={c.stars} opacity="0.15" />

        {/* Desk */}
        <rect x="60" y="230" width="280" height="12" rx="2" fill={c.desk} />
        {/* Desk legs */}
        <rect x="75" y="242" width="8" height="108" fill={c.desk} />
        <rect x="317" y="242" width="8" height="108" fill={c.desk} />
        {/* Desk shelf */}
        <rect x="75" y="295" width="250" height="6" rx="1" fill={c.desk} opacity="0.6" />

        {/* Monitor */}
        <rect x="130" y="150" width="140" height="80" rx="5" fill="#111" stroke={c.dim} strokeWidth="2" />
        <rect x="135" y="155" width="130" height="68" rx="2" fill={c.monitor} />
        {/* Monitor stand */}
        <rect x="185" y="230" width="30" height="5" fill="#222" />
        <rect x="195" y="228" width="10" height="7" fill="#222" />
        {/* Monitor glow */}
        <rect x="135" y="155" width="130" height="68" rx="2" fill={c.glow} opacity="0.05" />

        {/* Code lines on screen */}
        <g filter="url(#lofi-glow)">
          <rect x="142" y="163" width="45" height="3" rx="1" fill={c.code} opacity="0.7" />
          <rect x="142" y="170" width="70" height="3" rx="1" fill={c.code} opacity="0.5" />
          <rect x="150" y="177" width="55" height="3" rx="1" fill={c.code} opacity="0.6" />
          <rect x="150" y="184" width="40" height="3" rx="1" fill={c.code} opacity="0.4" />
          <rect x="150" y="191" width="60" height="3" rx="1" fill={c.code} opacity="0.55" />
          <rect x="142" y="198" width="35" height="3" rx="1" fill={c.code} opacity="0.5" />
          <rect x="142" y="205" width="65" height="3" rx="1" fill={c.code} opacity="0.45" />
          <rect x="150" y="212" width="48" height="3" rx="1" fill={c.code} opacity="0.6" />
          {/* Blinking cursor */}
          <rect x="200" y="212" width="2" height="6" fill={c.code} opacity="0.9">
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Character - body */}
        {/* Chair */}
        <ellipse cx="200" cy="310" rx="30" ry="5" fill={c.desk} opacity="0.8" />
        <rect x="195" y="310" width="10" height="35" fill="#1a1a1a" />
        {/* Chair back */}
        <rect x="175" y="245" width="50" height="65" rx="8" fill="#222" />
        <rect x="180" y="250" width="40" height="55" rx="5" fill="#2a2a2a" />

        {/* Torso */}
        <rect x="180" y="255" width="40" height="45" rx="5" fill="#333" />
        {/* Hoodie details */}
        <path d="M 192 255 Q 200 265 208 255" fill="none" stroke="#444" strokeWidth="1" />

        {/* Head */}
        <ellipse cx="200" cy="238" rx="16" ry="18" fill={c.skin} />
        {/* Hair */}
        <ellipse cx="200" cy="228" rx="18" ry="14" fill={c.hair} />
        <rect x="182" y="225" width="36" height="8" rx="3" fill={c.hair} />
        {/* Hair bangs hanging down */}
        <path d="M 184 228 Q 182 240 186 242" fill={c.hair} />

        {/* Headphones */}
        <path d="M 182 232 Q 178 215 200 212 Q 222 215 218 232" fill="none" stroke="#444" strokeWidth="3" />
        <circle cx="182" cy="236" r="5" fill="#444" />
        <circle cx="218" cy="236" r="5" fill="#444" />
        <circle cx="182" cy="236" r="3" fill="#555" />
        <circle cx="218" cy="236" r="3" fill="#555" />

        {/* Eyes (closed/relaxed) */}
        <line x1="193" y1="240" x2="197" y2="240" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="203" y1="240" x2="207" y2="240" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />

        {/* Arms */}
        {/* Left arm reaching to keyboard */}
        <path d="M 182 270 Q 165 285 155 225" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
        <circle cx="155" cy="224" r="5" fill={c.skin} />
        {/* Right arm reaching to keyboard */}
        <path d="M 218 270 Q 235 285 240 225" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
        <circle cx="240" cy="224" r="5" fill={c.skin} />

        {/* Keyboard */}
        <rect x="145" y="222" width="110" height="10" rx="2" fill="#1a1a1a" />
        <rect x="148" y="224" width="104" height="5" rx="1" fill="#222" />
        {/* Key presses */}
        <rect x="160" y="224" width="4" height="4" rx="0.5" fill={c.code} opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.3s" repeatCount="indefinite" />
        </rect>
        <rect x="190" y="224" width="4" height="4" rx="0.5" fill={c.code} opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.5s" repeatCount="indefinite" />
        </rect>
        <rect x="220" y="224" width="4" height="4" rx="0.5" fill={c.code} opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.4s" repeatCount="indefinite" />
        </rect>

        {/* Coffee mug */}
        <rect x="90" y="210" width="18" height="20" rx="3" fill={c.coffee} />
        <rect x="88" y="210" width="22" height="4" rx="2" fill={c.coffee} opacity="0.8" />
        {/* Handle */}
        <path d="M 108 214 Q 116 218 108 226" fill="none" stroke={c.coffee} strokeWidth="2.5" />
        {/* Steam */}
        <path d="M 95 208 Q 93 200 96 192" fill="none" stroke="white" strokeWidth="1" opacity="0.15">
          <animate attributeName="d" values="M 95 208 Q 93 200 96 192;M 95 208 Q 97 198 94 190;M 95 208 Q 93 200 96 192" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 100 206 Q 102 196 99 188" fill="none" stroke="white" strokeWidth="1" opacity="0.1">
          <animate attributeName="d" values="M 100 206 Q 102 196 99 188;M 100 206 Q 98 194 101 186;M 100 206 Q 102 196 99 188" dur="4s" repeatCount="indefinite" />
        </path>

        {/* Small plant */}
        <rect x="300" y="215" width="16" height="15" rx="2" fill={c.plant} opacity="0.5" />
        <ellipse cx="308" cy="210" rx="12" ry="8" fill={c.plant} opacity="0.4" />
        <line x1="305" y1="210" x2="302" y2="196" stroke={c.plant} strokeWidth="1.5" opacity="0.5" />
        <line x1="308" y1="208" x2="310" y2="193" stroke={c.plant} strokeWidth="1.5" opacity="0.5" />
        <line x1="311" y1="210" x2="316" y2="198" stroke={c.plant} strokeWidth="1.5" opacity="0.5" />
        <circle cx="302" cy="194" r="3" fill={c.plant} opacity="0.4" />
        <circle cx="310" cy="191" r="3.5" fill={c.plant} opacity="0.35" />
        <circle cx="316" cy="196" r="2.5" fill={c.plant} opacity="0.4" />

        {/* Subtle breathing animation on character */}
        <animateTransform xlinkHref="#torso-anim" attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="4s" repeatCount="indefinite" />

        {/* Ambient glow from monitor on character */}
        <ellipse cx="200" cy="240" rx="60" ry="40" fill={c.glow} opacity="0.02" />
      </svg>
    </div>
  );
}
