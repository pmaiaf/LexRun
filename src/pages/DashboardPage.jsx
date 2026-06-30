import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, AlertTriangle, Users, Briefcase, DollarSign, Clock, Sparkles, ArrowRight, ListTodo, CheckCircle2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useApi } from '../hooks/useApi.js'
import { financeiroService, agendaService, processosService } from '../services/api.js'
import { LoadingScreen, ErrorBlock } from '../components/ui/index.jsx'
import { GuiaPrimeirosPassos, TourBoasVindas } from '../components/Onboarding.jsx'
import { formatCurrency, prazoLabel, prioridadeClass, formatDate, formatDatetime } from '../utils/helpers.js'

function MetricCard({ label, value, delta, deltaUp, icon: Icon, iconColor, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon size={15} />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        : <p className="text-2xl font-semibold text-gray-900">{value}</p>
      }
      {delta && !loading && (
        <p className={`text-xs mt-1.5 flex items-center gap-1 ${deltaUp ? 'text-green-600' : 'text-red-500'}`}>
          {deltaUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {delta}
        </p>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>)}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const now = new Date()

  // Tour de boas-vindas: aparece só na primeira vez (marca no navegador).
  const [tourAberto, setTourAberto] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem('jf_tour_visto')) {
      setTourAberto(true)
    }
  }, [])
  function fecharTour() {
    localStorage.setItem('jf_tour_visto', '1')
    setTourAberto(false)
  }

  const { data: kpis,    loading: l1, error: e1, refetch: r1 } = useApi(() => financeiroService.dashboard({ mes: now.getMonth() + 1, ano: now.getFullYear() }), [])
  const { data: proxEvt, loading: l2 }                          = useApi(() => agendaService.proximos(), [])
  const { data: ativResumo }                                    = useApi(() => agendaService.resumo(), [])
  const { data: procData,loading: l3 }                          = useApi(() => processosService.listar({ limit: 5, prioridade: 'Alta' }), [])

  if (e1) return <ErrorBlock message={e1} onRetry={r1} />

  const processos = procData?.data || []
  const eventos   = proxEvt || []
  const receita   = kpis?.receita_mensal || []

  return (
    <div className="p-6 space-y-5">
      <TourBoasVindas aberto={tourAberto} onFechar={fecharTour} />

      <div>
        <h1 className="text-lg font-semibold text-gray-900">Visão geral</h1>
        <p className="text-sm text-gray-500">
          {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} · {user?.escritorio}
        </p>
      </div>

      <GuiaPrimeirosPassos />

      {/* Destaque: Pedidos */}
      <Link to="/pedidos" className="block group">
        <div className="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-900 text-white px-6 py-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-[15px]">Solicite petições, pareceres e contratos</p>
              <p className="text-sm text-white/70">Anexe os documentos do caso e receba a peça pronta para revisar e protocolar.</p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 bg-white text-brand-900 text-sm font-medium px-4 py-2 rounded-lg group-hover:gap-2.5 transition-all">
            Fazer solicitação <ArrowRight size={15} />
          </span>
        </div>
      </Link>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard loading={l1} label="Receita do Mês"
          value={kpis ? formatCurrency(kpis.receita_mes) : '—'}
          delta="vs. mês anterior" deltaUp icon={DollarSign} iconColor="bg-green-50 text-green-600" />
        <MetricCard loading={l1} label="Despesas"
          value={kpis ? formatCurrency(kpis.despesas_mes) : '—'}
          icon={TrendingDown} iconColor="bg-red-50 text-red-500" />
        <MetricCard loading={l1} label="Lucro Líquido"
          value={kpis ? formatCurrency(kpis.lucro_mes) : '—'}
          deltaUp icon={TrendingUp} iconColor="bg-brand-100 text-brand-700" />
        <MetricCard loading={l1} label="Inadimplência"
          value={kpis ? formatCurrency(kpis.inadimplencia) : '—'}
          delta={kpis ? `${kpis.inadim_clientes} cliente(s)` : ''}
          icon={AlertTriangle} iconColor="bg-amber-50 text-amber-600" />
      </div>

      {/* Atividades (Kanban) */}
      <Link to="/kanban" className="block">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'A concluir',        value: ativResumo?.a_concluir,     icon: ListTodo,      color: 'bg-brand-50 text-brand-700' },
            { label: 'Atrasadas',         value: ativResumo?.atrasadas,      icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
            { label: 'Concluídas no mês', value: ativResumo?.concluidas_mes, icon: CheckCircle2,  color: 'bg-green-50 text-green-600' },
          ].map((a) => (
            <div key={a.label} className="card p-4 flex items-center gap-3 hover:border-brand-200 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}><a.icon size={18} /></div>
              <div>
                <p className="text-xl font-semibold text-gray-900">{a.value ?? '—'}</p>
                <p className="text-xs text-gray-500">{a.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Link>

      {/* Gráfico + eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Receita mensal</p>
              <p className="text-xs text-gray-400">Últimos meses</p>
            </div>
          </div>
          {l1 ? (
            <div className="h-44 bg-gray-50 rounded-lg animate-pulse" />
          ) : receita.length === 0 || receita.every(r => !r.receita) ? (
            <div className="h-44 flex flex-col items-center justify-center text-center">
              <TrendingUp size={22} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Nenhuma receita registrada nos últimos meses</p>
              <p className="text-xs text-gray-300 mt-0.5">Os valores aparecem aqui conforme cobranças forem pagas</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={receita} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1B2E4B" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1B2E4B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#1B2E4B" strokeWidth={2} fill="url(#gradReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-4">Próximos eventos</p>
          {l2 ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          ) : eventos.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Nenhum evento nos próximos 7 dias</p>
          ) : (
            <div className="space-y-3">
              {eventos.slice(0, 4).map(ev => (
                <div key={ev.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={13} className="text-brand-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 leading-snug truncate">{ev.titulo}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDatetime(ev.data_hora)}</p>
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      ev.tipo === 'Audiência' ? 'bg-red-50 text-red-600' :
                      ev.tipo === 'Prazo'     ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'
                    }`}>{ev.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Processos urgentes */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-medium text-gray-800">Processos de alta prioridade</p>
          <a href="/processos" className="text-xs text-brand-700 hover:underline">Ver todos</a>
        </div>
        {l3 ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {processos.map(p => {
              const { label, class: cls } = prazoLabel(p.prazo)
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.cliente_nome} · {p.area}</p>
                  </div>
                  <span className={`badge ${prioridadeClass(p.prioridade)} hidden sm:inline-flex`}>{p.prioridade}</span>
                  <span className="text-xs text-gray-400 hidden md:block">{p.responsavel_nome}</span>
                  {p.prazo && <span className={`badge ${cls}`}>{label}</span>}
                </div>
              )
            })}
            {processos.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Nenhum processo encontrado</p>}
          </div>
        )}
      </div>
    </div>
  )
}
