import { Building2, DollarSign, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { superAdminService } from '../../services/api.js'
import { LoadingScreen, ErrorBlock } from '../../components/ui/index.jsx'

const STATUS_META = {
  ativo:        { label: 'Ativas',          icon: CheckCircle2, color: 'text-green-400 bg-green-500/10' },
  trial:        { label: 'Em teste',         icon: Clock,        color: 'text-blue-400 bg-blue-500/10'   },
  inadimplente: { label: 'Inadimplentes',    icon: AlertTriangle,color: 'text-red-400 bg-red-500/10'     },
  cancelado:    { label: 'Canceladas',       icon: XCircle,      color: 'text-gray-400 bg-gray-500/10'   },
  incompleta:   { label: 'Pagamento incompleto', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10' },
  pausada:      { label: 'Pausadas',         icon: Clock,        color: 'text-gray-400 bg-gray-500/10'   },
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useApi(() => superAdminService.dashboard(), [])

  if (loading) return <div className="p-6"><LoadingScreen /></div>
  if (error)   return <div className="p-6"><ErrorBlock message={error} onRetry={refetch} /></div>

  const porStatus = data?.por_status || {}

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Visão geral da plataforma</h1>
        <p className="text-sm text-gray-500">Dados consolidados de todos os escritórios cadastrados.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Escritórios</p>
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
              <Building2 size={14} className="text-gray-300"/>
            </div>
          </div>
          <p className="text-2xl font-semibold text-white">{data.total_escritorios}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">MRR (receita recorrente)</p>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign size={14} className="text-green-400"/>
            </div>
          </div>
          <p className="text-2xl font-semibold text-white">{formatCurrency(data.mrr)}</p>
        </div>

        {Object.entries(STATUS_META).slice(0, 2).map(([key, meta]) => (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{meta.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}>
                <meta.icon size={14}/>
              </div>
            </div>
            <p className="text-2xl font-semibold text-white">{porStatus[key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-sm font-medium text-white mb-4">Assinaturas por status</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                <meta.icon size={14}/>
              </div>
              <div>
                <p className="text-lg font-semibold text-white leading-none">{porStatus[key] || 0}</p>
                <p className="text-[11px] text-gray-500">{meta.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
