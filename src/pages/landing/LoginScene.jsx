// Banner ilustrado da tela de login — cena de escritório de advocacia.
// Base/placeholder: ilustração SVG estilizada. Pode ser substituída no futuro
// por uma ilustração profissional sem mexer no resto do LoginPage (só trocar
// este componente ou usar uma <img> no lugar dele).
export function LoginSceneEscritorio({ className = '' }) {
  return (
    <svg viewBox="0 0 480 760" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ls-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6c98e"/>
          <stop offset="1" stopColor="#bb9659"/>
        </linearGradient>
        <linearGradient id="ls-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2c20"/>
          <stop offset="1" stopColor="#2a2017"/>
        </linearGradient>
        <linearGradient id="ls-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a77c"/>
          <stop offset="1" stopColor="#c4926a"/>
        </linearGradient>
        <linearGradient id="ls-suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3f63"/>
          <stop offset="1" stopColor="#1f2f4b"/>
        </linearGradient>
        <radialGradient id="ls-lamp" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#f0d9a8" stopOpacity="0.35"/>
          <stop offset="1" stopColor="#f0d9a8" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="ls-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34507e"/>
          <stop offset="1" stopColor="#243a5e"/>
        </linearGradient>
      </defs>

      {/* Janela ao fundo */}
      <rect x="20" y="70" width="190" height="240" rx="8" fill="url(#ls-window)" opacity="0.5"/>
      <line x1="115" y1="70" x2="115" y2="310" stroke="#16243d" strokeWidth="6" opacity="0.6"/>
      <line x1="20" y1="180" x2="210" y2="180" stroke="#16243d" strokeWidth="6" opacity="0.6"/>
      <circle cx="165" cy="120" r="22" fill="#f0d9a8" opacity="0.22"/>

      {/* Estante */}
      <g transform="translate(285, 110)" opacity="0.7">
        <rect x="0" y="0" width="180" height="230" rx="6" fill="#26354f"/>
        <rect x="0" y="58" width="180" height="3" fill="#1b2d4b"/>
        <rect x="0" y="120" width="180" height="3" fill="#1b2d4b"/>
        <rect x="0" y="182" width="180" height="3" fill="#1b2d4b"/>
        <g fill="url(#ls-gold)" opacity="0.55">
          <rect x="14" y="12" width="11" height="40" rx="2"/>
          <rect x="28" y="12" width="11" height="40" rx="2"/>
          <rect x="42" y="16" width="11" height="36" rx="2"/>
          <rect x="64" y="12" width="11" height="40" rx="2"/>
        </g>
        <g fill="#9aa6b8" opacity="0.45">
          <rect x="96" y="14" width="11" height="38" rx="2"/>
          <rect x="110" y="14" width="11" height="38" rx="2"/>
          <rect x="20" y="72" width="11" height="40" rx="2"/>
          <rect x="34" y="72" width="11" height="40" rx="2"/>
          <rect x="130" y="134" width="11" height="40" rx="2"/>
          <rect x="144" y="134" width="11" height="40" rx="2"/>
        </g>
      </g>

      {/* Halo da luminária */}
      <ellipse cx="240" cy="430" rx="240" ry="170" fill="url(#ls-lamp)"/>

      {/* Mesa */}
      <rect x="0" y="540" width="480" height="220" fill="url(#ls-desk)"/>
      <rect x="0" y="540" width="480" height="5" fill="url(#ls-gold)" opacity="0.25"/>

      {/* Advogado */}
      <g transform="translate(165, 350)">
        <ellipse cx="95" cy="205" rx="115" ry="24" fill="#000000" opacity="0.22"/>
        <path d="M30 205 Q20 148 40 118 Q55 95 95 91 Q135 95 150 118 Q170 148 160 205 Z" fill="url(#ls-suit)"/>
        <path d="M95 91 L78 138 L95 148 L112 138 Z" fill="#ffffff" opacity="0.92"/>
        <path d="M88 148 L95 196 L102 148 L95 143 Z" fill="url(#ls-gold)" opacity="0.85"/>
        <path d="M40 118 Q22 138 18 182 L40 189 Q44 148 56 128 Z" fill="url(#ls-suit)"/>
        <path d="M150 118 Q168 138 172 182 L150 189 Q146 148 134 128 Z" fill="url(#ls-suit)"/>
        <ellipse cx="30" cy="187" rx="13" ry="11" fill="url(#ls-skin)"/>
        <ellipse cx="160" cy="187" rx="13" ry="11" fill="url(#ls-skin)"/>
        <path d="M70 57 Q70 30 95 30 Q120 30 120 57 Q120 84 95 88 Q70 84 70 57 Z" fill="url(#ls-skin)"/>
        <path d="M67 53 Q65 27 95 25 Q125 27 123 53 Q123 43 95 41 Q67 43 67 53 Z" fill="#2a3142"/>
        <path d="M65 51 Q63 29 95 27 L95 41 Q73 43 69 57 Z" fill="#222838"/>
      </g>

      {/* Documento sobre a mesa */}
      <g transform="translate(70, 585)">
        <rect x="0" y="0" width="145" height="98" rx="6" fill="url(#ls-desk)" stroke="#5a4632" strokeWidth="1"/>
        <rect x="0" y="0" width="145" height="13" rx="6" fill="#16243d"/>
        <rect x="14" y="26" width="116" height="6" rx="3" fill="#c9a25e" opacity="0.6"/>
        <rect x="14" y="42" width="98" height="5" rx="2.5" fill="#ffffff" opacity="0.25"/>
        <rect x="14" y="56" width="116" height="5" rx="2.5" fill="#ffffff" opacity="0.25"/>
        <rect x="14" y="70" width="78" height="5" rx="2.5" fill="#ffffff" opacity="0.25"/>
      </g>

      {/* Luminária */}
      <g transform="translate(330, 560)">
        <ellipse cx="40" cy="120" rx="44" ry="9" fill="#000000" opacity="0.2"/>
        <rect x="30" y="-16" width="18" height="130" rx="5" fill="#2c3d5c"/>
        <path d="M40 -28 Q12 -24 16 12 L64 12 Q68 -24 40 -28 Z" fill="url(#ls-gold)"/>
        <ellipse cx="40" cy="-6" rx="20" ry="8" fill="#f3e2bd" opacity="0.5"/>
      </g>
    </svg>
  )
}
