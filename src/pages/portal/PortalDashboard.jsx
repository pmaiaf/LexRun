import { Link } from 'react-router-dom'
import { FileText, DollarSign, Clock, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { usePortal } from './PortalContext.jsx'
import { useApi } from '../../hooks/useApi.js'
import { portalService } from '../../services/api.js'
import { LoadingScreen, ErrorBlock } from '../../components/ui/index.jsx'
import { formatCurrency, formatDate, prazoLabel } from '../../utils/helpers.js'

const statusIcon = s => s === 'Concluído'
  ? <CheckCircle size={14} className="text-green-500" />
  : <Clock size={14} className="text-blue-500" />

const statusCls = s => ({
  'Novo':         'bg-gray-100 text-gray-600',
  'Em Andamento': 'bg-blue-50 text-blue-700',
  'Aguardando':   'bg-amber-50 text-amber-700',
  'Concluído':    'bg-green-50 text-green-700',
}[s] || 'bg-gray-100 text-gray-600')

export default function PortalDashboard() {
  const { cliente } = usePortal()
  const { data: processos, loading: l1, error: e1, refetch: r1 } = useApi(() => portalService.processos(), [])
  const { data: cobrancas, loading: l2 }                          = useApi(() => portalService.cobrancas(), [])

  if (l1) return <LoadingScreen />
  if (e1) return <ErrorBlock message={e1} onRetry={r1} />

  const lista    = Array.isArray(processos) ? processos : []
  const cobLista = Array.isArray(cobrancas) ? cobrancas : []
  const ativos   = lista.filter(p => p.status !== 'Concluído')
  const pendentes= cobLista.filter(c => c.status !== 'Pago' && c.status !== 'Cancelado')
  const valorPend= pendentes.reduce((a, c) => a + parseFloat(c.valor || 0), 0)

  return (
    <div className="p-6 space-y-5">
      {/* Boas-vindas */}
      <div className="bg-brand-800 rounded-2xl p-6 text-white">
        <p className="text-white/60 text-sm mb-1">Bem-vindo ao seu portal</p>
        <h1 className="text-2xl font-semibold">{cliente?.nome}</h1>
        <p className="text-white/60 text-sm mt-1">Acompanhe seus processos e documentos aqui</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Processos ativos', value: ativos.length,              icon: FileText,   color: 'bg-brand-100 text-brand-700', to: '/portal/processos' },
          { label: 'A pagar',          value: formatCurrency(valorPend),  icon: DollarSign, color: 'bg-amber-50 text-amber-600',  to: '/portal/cobrancas' },
          { label: 'Documentos',       value: '—',                        icon: FileText,   color: 'bg-green-50 text-green-600',  to: '/portal/documentos'},
        ].map(m => (
          <Link key={m.label} to={m.to}
            className="card p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{m.label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.color}`}>
                <m.icon size={13} />
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-900">{m.value}</p>
            <p className="text-xs text-brand-600 mt-1 group-hover:underline">Ver detalhes →</p>
          </Link>
        ))}
      </div>

      {/* Processos recentes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-medium text-gray-800">Seus processos</p>
          <Link to="/portal/processos" className="text-xs text-brand-700 hover:underline">Ver todos</Link>
        </div>
        {lista.length === 0
          ? <p className="text-center text-sm text-gray-400 py-8">Nenhum processo encontrado</p>
          : lista.slice(0, 4).map(p => {
              const { label, class: cls } = prazoLabel(p.prazo)
              return (
                <Link key={p.id} to={`/portal/processos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.area || '—'}</p>
                  </div>
                  <span className={`badge ${statusCls(p.status)}`}>{p.status}</span>
                  {p.prazo && <span className={`badge ${cls}`}>{label}</span>}
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                </Link>
              )
            })
        }
      </div>

      {/* Cobranças pendentes */}
      {pendentes.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-500" />
              <p className="text-sm font-medium text-gray-800">Cobranças pendentes</p>
            </div>
            <Link to="/portal/cobrancas" className="text-xs text-brand-700 hover:underline">Ver todas</Link>
          </div>
          {pendentes.slice(0, 3).map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.descricao}</p>
                <p className="text-xs text-gray-400 mt-0.5">Vence em {formatDate(c.vencimento)}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.valor)}</span>
              <span className={`badge ${c.status === 'Atrasado' ? 'badge-red' : 'badge-amber'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
