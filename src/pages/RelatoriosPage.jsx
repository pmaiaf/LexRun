import { useState } from 'react'
import { Download, FileText, BarChart2, Users, Clock, TrendingUp, Filter } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { processosService, clientesService, financeiroService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, useToast } from '../components/ui/index.jsx'
import { formatCurrency } from '../utils/helpers.js'

const CORES = ['#0A1C3A', '#0EA5A0', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981']

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function exportCSV(dados, nome) {
  if (!dados?.length) return
  const cols = Object.keys(dados[0])
  const linhas = [cols.join(','), ...dados.map(r => cols.map(c => `"${(r[c] ?? '').toString().replace(/"/g, '""')}"`).join(','))]
  const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `${nome}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

async function exportPDF(titulo, dados, colunas) {
  // Carrega html2pdf.js dinamicamente (sem necessidade de npm install)
  if (!window.html2pdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const rows = dados.slice(0, 500)
  const colKeys = colunas || (rows[0] ? Object.keys(rows[0]) : [])

  const tabela = rows.length > 0 ? `
    <table>
      <thead><tr>${colKeys.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${colKeys.map(c=>`<td>${r[c]??'—'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>` : '<p style="color:#999">Nenhum dado para exibir.</p>'

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a;padding:32px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;border-bottom:2px solid #0A1C3A;padding-bottom:16px">
        <div style="background:#0A1C3A;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center">
          <span style="color:white;font-size:14px;font-weight:bold">J</span>
        </div>
        <div>
          <h1 style="margin:0;font-size:18px;color:#0A1C3A">${titulo}</h1>
          <p style="margin:0;font-size:12px;color:#666">Gerado em ${new Date().toLocaleDateString('pt-BR', {dateStyle:'full'})} · LexRun</p>
        </div>
      </div>
      <style>
        table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}
        th{background:#0A1C3A;color:white;padding:7px 10px;text-align:left;font-weight:600}
        td{padding:6px 10px;border-bottom:1px solid #eee;vertical-align:top}
        tr:nth-child(even) td{background:#f7f9fc}
      </style>
      ${tabela}
      <p style="font-size:10px;color:#aaa;margin-top:24px;text-align:right">
        LexRun · ${rows.length} registros exportados
      </p>
    </div>
  `

  const el = document.createElement('div')
  el.innerHTML = html
  document.body.appendChild(el)

  await window.html2pdf(el, {
    margin:      [8, 8, 8, 8],
    filename:    `${titulo.toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.pdf`,
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' },
  })

  document.body.removeChild(el)
}

export default function RelatoriosPage() {
  const toast = useToast()
  const now   = new Date()
  const [periodo, setPeriodo] = useState('mes')

  const { data: procData, loading: l1, error: e1, errorObj: eo1, refetch: r1 } = useApi(() => processosService.listar({ limit: 500 }), [])
  const { data: cliData,  loading: l2 }                          = useApi(() => clientesService.listar({ limit: 500 }), [])
  const { data: kpis,     loading: l3 }                          = useApi(() => financeiroService.dashboard({ mes: now.getMonth()+1, ano: now.getFullYear() }), [])

  if ((l1 || l2 || l3) && !procData) return <LoadingScreen />
  if (e1) return <ErrorBlock message={e1} error={eo1} onRetry={r1} />

  const processos = procData?.data || []
  const clientes  = cliData?.data  || []

  // ── Dados calculados ──────────────────────────────────────────────────────
  const totalAtivos    = processos.filter(p => p.status !== 'Concluído').length
  const totalConc      = processos.filter(p => p.status === 'Concluído').length
  const totalHoras     = processos.reduce((a, p) => a + parseFloat(p.horas_total || 0), 0)
  const totalHonorarios= processos.reduce((a, p) => a + parseFloat(p.honorarios  || 0), 0)

  // Por status
  const porStatus = ['Novo','Em Andamento','Aguardando','Concluído'].map(s => ({
    name: s, value: processos.filter(p => p.status === s).length,
  })).filter(d => d.value > 0)

  // Por área
  const areaMap = {}
  processos.forEach(p => { if (p.area) areaMap[p.area] = (areaMap[p.area] || 0) + 1 })
  const porArea = Object.entries(areaMap).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 6)

  // Por prioridade
  const porPrioridade = ['Alta','Médio','Baixo'].map(p => ({
    name: p, value: processos.filter(x => x.prioridade === p).length,
  }))

  // Receita mensal dos KPIs
  const receitaMensal = kpis?.receita_mensal || []

  // Dados para CSV de processos
  const csvProcessos = processos.map(p => ({
    Título:       p.titulo,
    Número:       p.numero || '',
    Cliente:      p.cliente_nome || '',
    Área:         p.area || '',
    Status:       p.status,
    Prioridade:   p.prioridade,
    Prazo:        p.prazo || '',
    Responsável:  p.responsavel_nome || '',
    'Horas':      parseFloat(p.horas_total || 0).toFixed(1),
    'Honorários': parseFloat(p.honorarios  || 0).toFixed(2),
  }))

  const csvClientes = clientes.map(c => ({
    Nome:       c.nome,
    Email:      c.email || '',
    Telefone:   c.telefone || '',
    'CPF/CNPJ': c.cpf_cnpj || '',
    Tipo:       c.tipo,
    Processos:  c.total_processos || 0,
    'Portal ativo': c.portal_ativo ? 'Sim' : 'Não',
  }))

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">Visão analítica do escritório</p>
        </div>
        <div className="flex gap-2">
          <select className="input text-sm w-auto" value={periodo} onChange={e => setPeriodo(e.target.value)}>
            <option value="mes">Este mês</option>
            <option value="trimestre">Trimestre</option>
            <option value="ano">Este ano</option>
            <option value="tudo">Tudo</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Processos ativos"  value={totalAtivos}               sub={`${totalConc} concluídos`}   icon={FileText}   color="bg-brand-100 text-brand-700" />
        <KpiCard label="Total de clientes" value={clientes.length}            sub={`${clientes.filter(c=>c.portal_ativo).length} com portal ativo`} icon={Users} color="bg-blue-50 text-blue-600" />
        <KpiCard label="Horas trabalhadas" value={`${totalHoras.toFixed(0)}h`} sub="todos os processos"         icon={Clock}      color="bg-amber-50 text-amber-600" />
        <KpiCard label="Honorários totais" value={formatCurrency(totalHonorarios)} sub="em carteira"            icon={TrendingUp} color="bg-green-50 text-green-600" />
      </div>

      {/* Gráficos linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Processos por status - pizza */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-800">Processos por status</p>
          </div>
          {porStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Nenhum processo encontrado</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={porStatus} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {porStatus.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {porStatus.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CORES[i % CORES.length] }} />
                      <span className="text-xs text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Por área - barras */}
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-4">Processos por área</p>
          {porArea.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Nenhum processo encontrado</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={porArea} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }} />
                <Bar dataKey="value" name="Processos" fill="#0A1C3A" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Receita mensal */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-800">Receita mensal</p>
          <button onClick={() => { toast.info('Exportando...'); exportCSV(kpis?.receita_mensal || [], 'financeiro') }}
            className="btn-secondary text-xs flex items-center gap-1.5">
            <Download size={12} /> Exportar CSV
          </button>
        </div>
        {l3 ? (
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        ) : receitaMensal.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={receitaMensal} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }} />
              <Line type="monotone" dataKey="receita"  name="Receita"  stroke="#0A1C3A" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="pendente" name="Pendente" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-gray-400">Sem dados financeiros no período selecionado</p>
          </div>
        )}
      </div>

      {/* Prioridades + Exportações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-4">Processos por prioridade</p>
          {porPrioridade.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Nenhum processo encontrado</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={porPrioridade} margin={{ top: 0, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }} />
                <Bar dataKey="value" name="Processos" radius={[3, 3, 0, 0]}>
                  {porPrioridade.map((d, i) => (
                    <Cell key={i} fill={['#EF4444','#F59E0B','#10B981'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Exportações */}
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-4">Exportar relatórios</p>
          <div className="space-y-2.5">
            {[
              {
                label: 'Todos os processos',
                sub: `${processos.length} registros`,
                csv: () => exportCSV(csvProcessos, 'processos'),
                pdf: () => exportPDF('Relatório de Processos', csvProcessos),
              },
              {
                label: 'Carteira de clientes',
                sub: `${clientes.length} registros`,
                csv: () => exportCSV(csvClientes, 'clientes'),
                pdf: () => exportPDF('Relatório de Clientes', csvClientes),
              },
              {
                label: 'Resumo financeiro',
                sub: 'Receitas e despesas mensais',
                csv: () => exportCSV(kpis?.receita_mensal||[], 'financeiro'),
                pdf: () => exportPDF('Relatório Financeiro', kpis?.receita_mensal||[]),
              },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.sub}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={r.csv} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Download size={11} /> CSV
                  </button>
                  <button onClick={r.pdf} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <FileText size={11} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
