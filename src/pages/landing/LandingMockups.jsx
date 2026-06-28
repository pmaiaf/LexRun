/**
 * Mockups ilustrativos das telas do LexRun, usados na landing page.
 * Não são screenshots reais — são recriações estilizadas em SVG que
 * comunicam a interface sem depender de capturas de tela do produto.
 */

export function MockupDashboard({ className = '' }) {
  return (
    <svg viewBox="0 0 640 420" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="420" rx="14" fill="#FDFCFA"/>
      <rect width="150" height="420" rx="14" fill="#0F1B2E"/>
      <rect x="22" y="28" width="80" height="10" rx="3" fill="#B8935A"/>
      {['Painel','Kanban','Clientes','Agenda','Financeiro'].map((_, i) => (
        <g key={i}>
          <rect x="20" y={70 + i*38} width="14" height="14" rx="4" fill={i===0 ? '#0EA5A0' : 'rgba(255,255,255,0.18)'}/>
          <rect x="42" y={73 + i*38} width={i===0 ? 78 : 60} height="8" rx="2.5" fill={i===0 ? '#fff' : 'rgba(255,255,255,0.35)'}/>
        </g>
      ))}

      <rect x="174" y="24" width="200" height="14" rx="4" fill="#1B2E4B"/>
      <circle cx="600" cy="32" r="14" fill="#0EA5A0"/>

      {[
        { x: 174, label: 'Processos ativos', value: '128', color: '#1B2E4B' },
        { x: 314, label: 'Audiências/mês', value: '17',  color: '#0EA5A0' },
        { x: 454, label: 'A receber',       value: 'R$ 64k', color: '#B8935A' },
      ].map((kpi, i) => (
        <g key={i}>
          <rect x={kpi.x} y="64" width="126" height="78" rx="10" fill="#fff" stroke="#EFEAE3"/>
          <rect x={kpi.x+14} y="80" width="70" height="7" rx="2" fill="#9CA3AF"/>
          <rect x={kpi.x+14} y="100" width="40" height="18" rx="3" fill={kpi.color}/>
          <text x={kpi.x+18} y={113} fontSize="11" fontFamily="monospace" fill="#fff">{kpi.value}</text>
        </g>
      ))}

      <rect x="174" y="160" width="406" height="160" rx="10" fill="#fff" stroke="#EFEAE3"/>
      <rect x="190" y="176" width="120" height="8" rx="2.5" fill="#1B2E4B"/>
      {[40, 70, 55, 90, 65, 100, 80].map((h, i) => (
        <rect key={i} x={196 + i*52} y={300 - h} width="28" height={h} rx="3" fill={i===5 ? '#0EA5A0' : '#E7E2D8'}/>
      ))}

      <rect x="174" y="334" width="406" height="62" rx="10" fill="#fff" stroke="#EFEAE3"/>
      <rect x="190" y="348" width="100" height="7" rx="2" fill="#1B2E4B"/>
      <rect x="190" y="364" width="220" height="6" rx="2" fill="#D1D5DB"/>
      <rect x="190" y="378" width="160" height="6" rx="2" fill="#D1D5DB"/>
    </svg>
  )
}

export function MockupKanban({ className = '' }) {
  const colunas = [
    { titulo: 'Distribuição', cor: '#9CA3AF', cards: 2 },
    { titulo: 'Instrução',    cor: '#0EA5A0', cards: 3 },
    { titulo: 'Aguardando',   cor: '#B8935A', cards: 1 },
    { titulo: 'Encerrado',    cor: '#22C55E', cards: 2 },
  ]
  return (
    <svg viewBox="0 0 640 420" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="420" rx="14" fill="#FDFCFA"/>
      <rect x="24" y="24" width="180" height="12" rx="3" fill="#1B2E4B"/>

      {colunas.map((col, ci) => {
        const x = 24 + ci * 153
        return (
          <g key={ci}>
            <rect x={x} y="56" width="138" height="340" rx="10" fill="#F4F1EA"/>
            <circle cx={x+18} cy="76" r="4" fill={col.cor}/>
            <rect x={x+28} y="72" width="80" height="8" rx="2.5" fill="#374151"/>
            {Array.from({ length: col.cards }).map((_, i) => (
              <g key={i}>
                <rect x={x+10} y={96 + i*72} width="118" height="62" rx="8" fill="#fff" stroke="#EFEAE3"/>
                <rect x={x+20} y={106 + i*72} width="70" height="7" rx="2" fill="#1B2E4B"/>
                <rect x={x+20} y={120 + i*72} width="50" height="6" rx="2" fill="#9CA3AF"/>
                <rect x={x+20} y={138 + i*72} width="36" height="11" rx="5" fill={col.cor} opacity="0.18"/>
                <rect x={x+25} y={141} width="26" height="5" rx="2" fill={col.cor}/>
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

export function MockupFinanceiro({ className = '' }) {
  return (
    <svg viewBox="0 0 640 420" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="420" rx="14" fill="#FDFCFA"/>
      <rect x="24" y="24" width="160" height="12" rx="3" fill="#1B2E4B"/>

      {[
        { label: 'Receita do mês', value: 'R$ 48.200', color: '#1B2E4B' },
        { label: 'Inadimplência',  value: 'R$ 3.100',  color: '#B8935A' },
        { label: 'Lucro líquido',  value: 'R$ 31.900', color: '#0EA5A0' },
      ].map((kpi, i) => (
        <g key={i}>
          <rect x={24 + i*206} y="56" width="190" height="64" rx="10" fill="#fff" stroke="#EFEAE3"/>
          <rect x={24 + i*206 + 14} y="70" width="90" height="7" rx="2" fill="#9CA3AF"/>
          <rect x={24 + i*206 + 14} y="90" width="60" height="11" rx="3" fill={kpi.color}/>
        </g>
      ))}

      <rect x="24" y="138" width="592" height="258" rx="10" fill="#fff" stroke="#EFEAE3"/>
      <rect x="40" y="154" width="120" height="8" rx="2.5" fill="#1B2E4B"/>
      {[
        { nome: 'Maria Andrade', status: 'Pago',     cor: '#22C55E' },
        { nome: 'Carlos Pires',  status: 'Pendente', cor: '#B8935A' },
        { nome: 'Beta Comércio', status: 'Atrasado', cor: '#EF4444' },
        { nome: 'João Salles',   status: 'Pago',     cor: '#22C55E' },
      ].map((row, i) => (
        <g key={i}>
          <line x1="40" x2="576" y1={184 + i*44} y2={184 + i*44} stroke="#F4F1EA"/>
          <circle cx="52" cy={184 + i*44 + 22} r="11" fill="#E7E2D8"/>
          <rect x="72" y={184 + i*44 + 16} width="100" height="7" rx="2" fill="#374151"/>
          <rect x="72" y={184 + i*44 + 28} width="60" height="6" rx="2" fill="#9CA3AF"/>
          <rect x="430" y={184 + i*44 + 16} width="60" height="7" rx="2" fill="#374151"/>
          <rect x="510" y={184 + i*44 + 14} width="66" height="18" rx="9" fill={row.cor} opacity="0.15"/>
          <rect x="520" y={184 + i*44 + 19} width="46" height="7" rx="2" fill={row.cor}/>
        </g>
      ))}
    </svg>
  )
}
