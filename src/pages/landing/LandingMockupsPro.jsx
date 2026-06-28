/**
 * Mockups premium da landing — recriações em SVG das telas reais do LexRun,
 * baseadas nos screenshots do sistema (dados fictícios). Leves, nítidos e
 * responsivos. Paleta: brand #0F1B2E / accent #0EA5A0 / gold #B8935A.
 */

// Kanban jurídico com 4 colunas de fase processual.
export function MockupKanbanPro({ className = '' }) {
  const colunas = [
    { titulo: 'Distribuição', cor: '#94A3B8', n: 2, cards: [
      { t: 'Ação Previdenciária', c: 'Maria Ferreira', tag: 'Alta', tagCor: '#DC2626' },
      { t: 'Divórcio Rodrigues', c: 'Pedro Rodrigues', tag: 'Médio', tagCor: '#D97706' },
    ]},
    { titulo: 'Instrução', cor: '#0EA5A0', n: 2, cards: [
      { t: 'Rescisão Trabalhista', c: 'TechCorp Ltda', tag: 'Alta', tagCor: '#DC2626' },
      { t: 'Contrato Imobiliário', c: 'Ana Costa', tag: 'Baixo', tagCor: '#059669' },
    ]},
    { titulo: 'Aguardando', cor: '#D97706', n: 2, cards: [
      { t: 'Inventário Mello', c: 'Família Mello', tag: 'Médio', tagCor: '#D97706' },
      { t: 'Usucapião Urbano', c: 'Carlos Neves', tag: 'Médio', tagCor: '#D97706' },
    ]},
    { titulo: 'Encerrado', cor: '#059669', n: 1, cards: [
      { t: 'Silva vs. Banco', c: 'João Silva', tag: 'Alta', tagCor: '#DC2626' },
    ]},
  ]
  return (
    <svg viewBox="0 0 720 460" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="720" height="460" rx="16" fill="#F7F6F3"/>
      <rect x="24" y="24" width="170" height="12" rx="4" fill="#0F1B2E"/>
      <rect x="24" y="44" width="120" height="7" rx="3" fill="#9CA3AF"/>
      {colunas.map((col, i) => {
        const x = 24 + i * 172
        return (
          <g key={i}>
            <circle cx={x + 6} cy="78" r="4" fill={col.cor}/>
            <rect x={x + 18} y="73" width="92" height="9" rx="3" fill="#374151"/>
            <text x={x + 150} y="82" fontSize="11" fontFamily="sans-serif" fill="#9CA3AF" textAnchor="end">{col.n}</text>
            {col.cards.map((card, j) => (
              <g key={j} transform={`translate(${x}, ${100 + j * 96})`}>
                <rect width="156" height="84" rx="10" fill="#fff" stroke="#EAE6DF"/>
                <rect x="14" y="14" width="110" height="8" rx="2.5" fill="#1B2E4B"/>
                <rect x="14" y="30" width="80" height="6" rx="2" fill="#9CA3AF"/>
                <rect x="14" y="56" width="42" height="16" rx="8" fill={card.tagCor} opacity="0.14"/>
                <text x="35" y="67" fontSize="9" fontFamily="sans-serif" fill={card.tagCor} textAnchor="middle">{card.tag}</text>
                <rect x="104" y="58" width="38" height="12" rx="6" fill="#FEE2E2"/>
                <text x="123" y="67" fontSize="8" fontFamily="sans-serif" fill="#DC2626" textAnchor="middle">Vencido</text>
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// Portal do cliente — linha do tempo do processo em linguagem simples.
export function MockupPortal({ className = '' }) {
  const eventos = [
    { t: 'Petição inicial protocolada', d: '11/05/2025', done: true },
    { t: 'Citação do réu realizada', d: '27/05/2025', done: true },
    { t: 'Audiência de conciliação', d: '15/07/2025', done: 'now' },
    { t: 'Prazo para contestação', d: '', done: false },
  ]
  return (
    <svg viewBox="0 0 560 440" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="560" height="440" rx="16" fill="#F7F6F3"/>
      <rect width="150" height="440" rx="16" fill="#0F1B2E"/>
      <rect x="22" y="26" width="74" height="9" rx="3" fill="#fff" opacity="0.9"/>
      <rect x="22" y="40" width="50" height="6" rx="2" fill="#B8935A"/>
      {['Início','Meus processos','Documentos','Cobranças'].map((_, i) => (
        <g key={i}>
          <rect x="20" y={74 + i*34} width="13" height="13" rx="4" fill={i===1 ? '#0EA5A0' : 'rgba(255,255,255,0.15)'}/>
          <rect x="40" y={77 + i*34} width={i===1?72:54} height="7" rx="2" fill={i===1?'#fff':'rgba(255,255,255,0.3)'}/>
        </g>
      ))}

      <rect x="172" y="26" width="160" height="10" rx="3" fill="#1B2E4B"/>
      <rect x="172" y="54" width="366" height="48" rx="10" fill="#fff" stroke="#EAE6DF"/>
      <rect x="186" y="68" width="60" height="8" rx="2.5" fill="#059669"/>
      <rect x="186" y="84" width="120" height="6" rx="2" fill="#374151"/>

      <rect x="172" y="118" width="366" height="296" rx="10" fill="#fff" stroke="#EAE6DF"/>
      <rect x="188" y="134" width="180" height="8" rx="2.5" fill="#1B2E4B"/>
      {eventos.map((e, i) => {
        const y = 162 + i * 62
        const col = e.done === true ? '#059669' : e.done === 'now' ? '#0EA5A0' : '#CBD5E1'
        return (
          <g key={i}>
            {i < eventos.length - 1 && <line x1="200" y1={y+8} x2="200" y2={y+54} stroke="#E5E7EB" strokeWidth="2"/>}
            <circle cx="200" cy={y} r="8" fill="#fff" stroke={col} strokeWidth="2.5"/>
            {e.done === true && <path d={`M196 ${y} l3 3 l6 -7`} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round"/>}
            {e.done === 'now' && <circle cx="200" cy={y} r="3" fill={col}/>}
            <rect x="220" y={y - 8} width="160" height="8" rx="2.5" fill={e.done===false ? '#CBD5E1' : '#1B2E4B'}/>
            {e.d && <rect x="220" y={y + 6} width="60" height="6" rx="2" fill="#9CA3AF"/>}
            <rect x="220" y={y + 20} width="300" height="20" rx="6" fill="#F8FAFC"/>
          </g>
        )
      })}
    </svg>
  )
}

// Relatórios — gráficos de status (donut) e área (barras).
export function MockupRelatorios({ className = '' }) {
  return (
    <svg viewBox="0 0 680 420" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="680" height="420" rx="16" fill="#F7F6F3"/>
      <rect x="24" y="24" width="140" height="12" rx="4" fill="#0F1B2E"/>

      {[
        { x: 24, label: 'Processos ativos', value: '6', cor: '#1B2E4B' },
        { x: 192, label: 'Clientes', value: '7', cor: '#0EA5A0' },
        { x: 360, label: 'Horas', value: '79h', cor: '#B8935A' },
        { x: 528, label: 'Honorários', value: 'R$58k', cor: '#059669' },
      ].map((k, i) => (
        <g key={i}>
          <rect x={k.x} y="52" width="128" height="70" rx="10" fill="#fff" stroke="#EAE6DF"/>
          <rect x={k.x+14} y="66" width="64" height="6" rx="2" fill="#9CA3AF"/>
          <text x={k.x+14} y="100" fontSize="20" fontFamily="sans-serif" fontWeight="700" fill={k.cor}>{k.value}</text>
        </g>
      ))}

      {/* Donut */}
      <rect x="24" y="140" width="310" height="256" rx="12" fill="#fff" stroke="#EAE6DF"/>
      <rect x="42" y="160" width="140" height="9" rx="3" fill="#1B2E4B"/>
      <g transform="translate(120, 280)">
        <circle r="58" fill="none" stroke="#1B2E4B" strokeWidth="26" strokeDasharray="91 273" transform="rotate(-90)"/>
        <circle r="58" fill="none" stroke="#0EA5A0" strokeWidth="26" strokeDasharray="91 273" strokeDashoffset="-91" transform="rotate(-90)"/>
        <circle r="58" fill="none" stroke="#D97706" strokeWidth="26" strokeDasharray="91 273" strokeDashoffset="-182" transform="rotate(-90)"/>
        <circle r="58" fill="none" stroke="#DC2626" strokeWidth="26" strokeDasharray="45 319" strokeDashoffset="-273" transform="rotate(-90)"/>
      </g>
      {['Novo','Em andamento','Aguardando','Concluído'].map((_, i) => (
        <g key={i} transform={`translate(208, ${210 + i*32})`}>
          <circle cx="6" cy="6" r="5" fill={['#1B2E4B','#0EA5A0','#D97706','#DC2626'][i]}/>
          <rect x="20" y="2" width="80" height="7" rx="2" fill="#6B7280"/>
        </g>
      ))}

      {/* Barras por área */}
      <rect x="350" y="140" width="306" height="256" rx="12" fill="#fff" stroke="#EAE6DF"/>
      <rect x="368" y="160" width="140" height="9" rx="3" fill="#1B2E4B"/>
      {[
        { l: 'Família', w: 270 }, { l: 'Imobiliário', w: 270 }, { l: 'Cível', w: 150 },
        { l: 'Trabalhista', w: 150 }, { l: 'Previdenciário', w: 150 },
      ].map((b, i) => (
        <g key={i} transform={`translate(368, ${196 + i*36})`}>
          <rect x="0" y="0" width="64" height="8" rx="2" fill="#9CA3AF"/>
          <rect x="0" y="14" width={b.w} height="14" rx="4" fill="#1B2E4B"/>
        </g>
      ))}
    </svg>
  )
}
