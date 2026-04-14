'use client';

/**
 * Realistic credit card artwork components.
 * Each card is an SVG at standard CR80 proportions (400×252 viewBox ≈ 1.586:1).
 * Designs closely mirror the real card color schemes and visual identities.
 */

interface CardProps { lastFour: string }

// ── Shared sub-components ─────────────────────────────────────────────────────

function Chip() {
  return (
    <g transform="translate(24, 88)">
      <rect width="38" height="30" rx="5" fill="#D4A843" stroke="#B8922E" strokeWidth={0.8}/>
      <line x1={0}  y1={10} x2={38} y2={10} stroke="#B8922E" strokeWidth={0.7}/>
      <line x1={0}  y1={20} x2={38} y2={20} stroke="#B8922E" strokeWidth={0.7}/>
      <line x1={13} y1={0}  x2={13} y2={30} stroke="#B8922E" strokeWidth={0.7}/>
      <line x1={25} y1={0}  x2={25} y2={30} stroke="#B8922E" strokeWidth={0.7}/>
      <rect x={13} y={10} width={12} height={10} rx={1} fill="#C49030"/>
      {/* shine */}
      <rect width={38} height={30} rx={5}
        fill="none" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.2),transparent)' }}/>
    </g>
  );
}

function ContactlessIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} opacity={0.65}>
      <path d="M10 12 Q15 7 15 4 Q15 1 10 -4" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round"/>
      <path d="M7 9  Q12 5 12 4 Q12 3  7  0"  fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round"/>
      <path d="M4 6  Q9  3  9  4 Q9  5  4  4" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round"/>
    </g>
  );
}

function VisaMark({ x, y, color = "white" }: { x: number; y: number; color?: string }) {
  return (
    <text x={x} y={y} fontFamily="Arial, sans-serif" fontWeight={900} fontSize={20}
      fill={color} letterSpacing={-0.5} fontStyle="italic">VISA</text>
  );
}

function MastercardMark({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0}  cy={0} r={14} fill="#EB001B" opacity={0.95}/>
      <circle cx={18} cy={0} r={14} fill="#F79E1B" opacity={0.95}/>
      <path d="M9,-10 Q14,0 9,10 Q4,0 9,-10z" fill="#FF5F00"/>
    </g>
  );
}

function AmexIssuerText({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <text x={x} y={y} fontFamily="Arial, sans-serif" fontWeight={900} fontSize={11}
      fill={color} letterSpacing={2}>AMERICAN EXPRESS</text>
  );
}

function CardNumber({ x, y, lastFour, color, amex = false }: {
  x: number; y: number; lastFour: string; color: string; amex?: boolean
}) {
  const num = amex
    ? `•••• •••••• •••${lastFour.slice(-1)}`
    : `•••• •••• •••• ${lastFour}`;
  return (
    <text x={x} y={y} fontFamily="'Courier New', Courier, monospace" fontSize={16}
      fill={color} letterSpacing={2.5}>{num}</text>
  );
}

function CardFooter({ color }: { color: string }) {
  return (
    <>
      <text x={24} y={200} fontFamily="Arial, sans-serif" fontSize={10}
        fill={color} letterSpacing={1.5}>CARDHOLDER NAME</text>
      <text x={24} y={214} fontFamily="'Courier New', Courier, monospace" fontSize={11}
        fill={color} letterSpacing={1}>VALID THRU  09/28</text>
    </>
  );
}

// ── 1. Amex Gold Card ─────────────────────────────────────────────────────────
export function AmexGoldArt({ lastFour }: CardProps) {
  return (
    <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl drop-shadow-xl" role="img" aria-label="Amex Gold Card">
      <defs>
        <linearGradient id="ag-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#B8862A"/>
          <stop offset="35%"  stopColor="#F0D070"/>
          <stop offset="65%"  stopColor="#D4A840"/>
          <stop offset="100%" stopColor="#9A7020"/>
        </linearGradient>
        <pattern id="ag-lines" patternUnits="userSpaceOnUse" width={400} height={5}>
          <rect width={400} height={1}   fill="rgba(0,0,0,0.07)"/>
          <rect y={2.5} width={400} height={0.5} fill="rgba(255,255,255,0.2)"/>
        </pattern>
      </defs>

      <rect width={400} height={252} rx={14} fill="url(#ag-bg)"/>
      <rect width={400} height={252} rx={14} fill="url(#ag-lines)"/>
      <ellipse cx={310} cy={70} rx={200} ry={110} fill="rgba(255,255,255,0.13)"/>
      <ellipse cx={60} cy={210} rx={120} ry={80} fill="rgba(0,0,0,0.07)"/>
      {/* edge gloss */}
      <rect width={400} height={252} rx={14} fill="none"
        stroke="rgba(255,255,255,0.25)" strokeWidth={1}/>

      <AmexIssuerText x={24} y={36} color="rgba(70,38,0,0.75)"/>
      <Chip/>
      <ContactlessIcon x={70} y={103}/>
      <CardNumber x={24} y={168} lastFour={lastFour} color="rgba(60,35,0,0.9)" amex/>
      <CardFooter color="rgba(70,38,0,0.6)"/>

      {/* GOLD CARD badge */}
      <rect x={24} y={228} width={76} height={17} rx={3} fill="rgba(0,0,0,0.13)"/>
      <text x={30} y={240} fontFamily="Arial, sans-serif" fontWeight={800} fontSize={9}
        fill="rgba(70,38,0,0.85)" letterSpacing={2}>GOLD CARD</text>

      {/* Centurion watermark */}
      <text x={340} y={220} fontFamily="serif" fontSize={110} fill="rgba(0,0,0,0.05)"
        textAnchor="middle">♦</text>
    </svg>
  );
}

// ── 2. Chase Freedom Flex ─────────────────────────────────────────────────────
export function FreedomFlexArt({ lastFour }: CardProps) {
  return (
    <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl drop-shadow-xl" role="img" aria-label="Chase Freedom Flex">
      <defs>
        <linearGradient id="ff-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#003087"/>
          <stop offset="100%" stopColor="#1565C0"/>
        </linearGradient>
        <pattern id="ff-stripes" patternUnits="userSpaceOnUse" width={24} height={24}
          patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={24} stroke="rgba(255,255,255,0.035)" strokeWidth={10}/>
        </pattern>
      </defs>

      <rect width={400} height={252} rx={14} fill="url(#ff-bg)"/>
      <rect width={400} height={252} rx={14} fill="url(#ff-stripes)"/>
      <ellipse cx={360} cy={60} rx={160} ry={90} fill="rgba(255,255,255,0.07)"/>
      <ellipse cx={200} cy={300} rx={300} ry={90} fill="rgba(0,0,0,0.15)"/>
      <rect width={400} height={252} rx={14} fill="none"
        stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>

      <text x={24} y={38} fontFamily="Arial, sans-serif" fontWeight={900} fontSize={22}
        fill="white" letterSpacing={3}>CHASE</text>

      <Chip/>
      <ContactlessIcon x={70} y={103}/>
      <CardNumber x={24} y={168} lastFour={lastFour} color="rgba(255,255,255,0.9)"/>
      <CardFooter color="rgba(255,255,255,0.55)"/>

      <text x={24} y={240} fontFamily="Arial, sans-serif" fontWeight={700} fontSize={11}
        fill="rgba(255,255,255,0.8)" letterSpacing={1.5}>FREEDOM FLEX℠</text>

      <MastercardMark x={358} y={222}/>
    </svg>
  );
}

// ── 3. Citi Custom Cash ───────────────────────────────────────────────────────
export function CitiCustomCashArt({ lastFour }: CardProps) {
  return (
    <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl drop-shadow-xl" role="img" aria-label="Citi Custom Cash Card">
      <defs>
        <linearGradient id="cc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00264D"/>
          <stop offset="60%"  stopColor="#003D7A"/>
          <stop offset="100%" stopColor="#0059A8"/>
        </linearGradient>
        <linearGradient id="cc-arc" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FF4B4B"/>
          <stop offset="100%" stopColor="#FF9900"/>
        </linearGradient>
      </defs>

      <rect width={400} height={252} rx={14} fill="url(#cc-bg)"/>
      <ellipse cx={350} cy={50} rx={150} ry={100} fill="rgba(255,255,255,0.05)"/>
      <ellipse cx={50}  cy={220} rx={120} ry={80}  fill="rgba(0,0,0,0.1)"/>
      <rect width={400} height={252} rx={14} fill="none"
        stroke="rgba(255,255,255,0.1)" strokeWidth={1}/>

      {/* Citi arc + wordmark */}
      <path d="M24,32 Q24,19 37,19 Q45,19 45,28"
        fill="none" stroke="url(#cc-arc)" strokeWidth={4.5} strokeLinecap="round"/>
      <text x={51} y={33} fontFamily="Arial, sans-serif" fontWeight={900} fontSize={19}
        fill="white" letterSpacing={0.5}>citi</text>

      <Chip/>
      <ContactlessIcon x={70} y={103}/>
      <CardNumber x={24} y={168} lastFour={lastFour} color="rgba(255,255,255,0.9)"/>
      <CardFooter color="rgba(255,255,255,0.55)"/>

      <text x={24} y={240} fontFamily="Arial, sans-serif" fontWeight={700} fontSize={11}
        fill="rgba(255,255,255,0.75)" letterSpacing={1.5}>CUSTOM CASH℠</text>

      <MastercardMark x={358} y={222}/>
    </svg>
  );
}

// ── 4. Capital One Venture X ──────────────────────────────────────────────────
export function VentureXArt({ lastFour }: CardProps) {
  const stars: [number, number][] = [
    [55,38],[115,22],[195,52],[278,28],[338,68],[78,128],[308,108],
    [148,88],[358,148],[48,198],[168,178],[328,188],[238,218],[290,60],[180,35],
  ];
  return (
    <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl drop-shadow-xl" role="img" aria-label="Capital One Venture X">
      <defs>
        <linearGradient id="vx-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#090912"/>
          <stop offset="50%"  stopColor="#10101E"/>
          <stop offset="100%" stopColor="#181828"/>
        </linearGradient>
        <linearGradient id="vx-shimmer" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#5555FF" stopOpacity={0.18}/>
          <stop offset="50%"  stopColor="#8888FF" stopOpacity={0.07}/>
          <stop offset="100%" stopColor="#0000CC" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="vx-text" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#9898FF"/>
          <stop offset="45%"  stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#6868CC"/>
        </linearGradient>
      </defs>

      <rect width={400} height={252} rx={14} fill="url(#vx-bg)"/>
      <ellipse cx={380} cy={60} rx={200} ry={130} fill="url(#vx-shimmer)"/>
      {stars.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={0.9} fill="rgba(255,255,255,0.3)"/>
      ))}
      <rect width={400} height={252} rx={14} fill="none"
        stroke="rgba(100,100,255,0.15)" strokeWidth={1}/>

      <text x={24} y={30} fontFamily="Arial, sans-serif" fontWeight={400} fontSize={10}
        fill="rgba(255,255,255,0.45)" letterSpacing={2}>CAPITAL ONE</text>

      <text x={24} y={62} fontFamily="Arial, sans-serif" fontWeight={900} fontSize={28}
        fill="url(#vx-text)" letterSpacing={1}>Venture X</text>

      <Chip/>
      <ContactlessIcon x={70} y={103}/>
      <CardNumber x={24} y={168} lastFour={lastFour} color="rgba(255,255,255,0.82)"/>
      <CardFooter color="rgba(255,255,255,0.4)"/>

      <text x={24} y={238} fontFamily="Arial, sans-serif" fontWeight={300} fontSize={10}
        fill="rgba(150,150,255,0.6)" letterSpacing={3}>INFINITE</text>

      <VisaMark x={328} y={244} color="rgba(255,255,255,0.65)"/>
    </svg>
  );
}

// ── 5. Chase Sapphire Preferred ───────────────────────────────────────────────
export function SapphirePreferredArt({ lastFour }: CardProps) {
  return (
    <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl drop-shadow-xl" role="img" aria-label="Chase Sapphire Preferred">
      <defs>
        <linearGradient id="sp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#082A5E"/>
          <stop offset="40%"  stopColor="#0D3F87"/>
          <stop offset="100%" stopColor="#071E44"/>
        </linearGradient>
        {/* Brushed horizontal metal banding — the signature Sapphire look */}
        <linearGradient id="sp-brush" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.16)"/>
          <stop offset="20%"  stopColor="rgba(255,255,255,0.04)"/>
          <stop offset="40%"  stopColor="rgba(255,255,255,0.13)"/>
          <stop offset="60%"  stopColor="rgba(255,255,255,0.03)"/>
          <stop offset="80%"  stopColor="rgba(255,255,255,0.11)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)"/>
        </linearGradient>
      </defs>

      <rect width={400} height={252} rx={14} fill="url(#sp-bg)"/>
      <rect width={400} height={252} rx={14} fill="url(#sp-brush)"/>
      <ellipse cx={280} cy={80} rx={200} ry={120} fill="rgba(80,140,255,0.07)"/>
      {/* Gloss edge */}
      <rect width={400} height={252} rx={14} fill="none"
        stroke="rgba(255,255,255,0.18)" strokeWidth={1.5}/>

      <text x={24} y={38} fontFamily="Arial, sans-serif" fontWeight={900} fontSize={22}
        fill="rgba(255,255,255,0.9)" letterSpacing={3}>CHASE</text>

      <Chip/>
      <ContactlessIcon x={70} y={103}/>
      <CardNumber x={24} y={168} lastFour={lastFour} color="rgba(255,255,255,0.9)"/>
      <CardFooter color="rgba(255,255,255,0.5)"/>

      <text x={24} y={234} fontFamily="Arial, sans-serif" fontWeight={300} fontSize={10}
        fill="rgba(255,255,255,0.5)" letterSpacing={2}>SAPPHIRE</text>
      <text x={24} y={248} fontFamily="Arial, sans-serif" fontWeight={800} fontSize={12}
        fill="rgba(255,255,255,0.82)" letterSpacing={2}>PREFERRED</text>

      <VisaMark x={328} y={244} color="rgba(255,255,255,0.75)"/>
    </svg>
  );
}

// ── 6. Amex Blue Cash Preferred ───────────────────────────────────────────────
export function BlueCashPreferredArt({ lastFour }: CardProps) {
  return (
    <svg viewBox="0 0 400 252" xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-2xl drop-shadow-xl" role="img" aria-label="Blue Cash Preferred Card">
      <defs>
        <linearGradient id="bcp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0C2EA0"/>
          <stop offset="50%"  stopColor="#1347CC"/>
          <stop offset="100%" stopColor="#0A2080"/>
        </linearGradient>
        <linearGradient id="bcp-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)"/>
          <stop offset="50%"  stopColor="rgba(255,255,255,0.08)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>

      <rect width={400} height={252} rx={14} fill="url(#bcp-bg)"/>
      {/* Horizontal sheen bands */}
      {[0,50,100,150,200].map((y, i) => (
        <rect key={i} y={y} width={400} height={25} fill="url(#bcp-sheen)"/>
      ))}
      <ellipse cx={340} cy={70} rx={180} ry={100} fill="rgba(255,255,255,0.06)"/>
      <rect width={400} height={252} rx={14} fill="none"
        stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>

      <AmexIssuerText x={24} y={36} color="rgba(255,255,255,0.65)"/>
      <Chip/>
      <ContactlessIcon x={70} y={103}/>
      <CardNumber x={24} y={168} lastFour={lastFour} color="rgba(255,255,255,0.9)" amex/>
      <CardFooter color="rgba(255,255,255,0.5)"/>

      <text x={24} y={234} fontFamily="Arial, sans-serif" fontWeight={300} fontSize={10}
        fill="rgba(255,255,255,0.5)" letterSpacing={2}>BLUE CASH</text>
      <text x={24} y={248} fontFamily="Arial, sans-serif" fontWeight={800} fontSize={12}
        fill="rgba(255,255,255,0.82)" letterSpacing={2}>PREFERRED</text>

      <AmexIssuerText x={245} y={244} color="rgba(255,255,255,0.45)"/>
    </svg>
  );
}

// ── Dispatch map ──────────────────────────────────────────────────────────────

const ARTWORK_MAP: Record<string, React.ComponentType<CardProps>> = {
  'amex-gold':           AmexGoldArt,
  'chase-freedom-flex':  FreedomFlexArt,
  'citi-custom-cash':    CitiCustomCashArt,
  'venture-x':           VentureXArt,
  'sapphire-preferred':  SapphirePreferredArt,
  'blue-cash-preferred': BlueCashPreferredArt,
};

export function CardArtwork({ cardId, lastFour }: { cardId: string; lastFour: string }) {
  const Art = ARTWORK_MAP[cardId];
  if (!Art) return null;
  return <Art lastFour={lastFour}/>;
}
