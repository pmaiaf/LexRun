import { useState } from 'react'
import { Search, Users, X } from 'lucide-react'
import { useApi, useAction } from '../../hooks/useApi.js'
import { superAdminService } from '../../services/api.js'
import { LoadingScreen, ErrorBlock, useToast } from '../../components/ui/index.jsx'

const FILTROS = [
  { id: '',             label: 'Todos' },
  { id: 'ativo',        label: 'Ativos' },
  { id: 'a_vencer',     label: 'A vencer (7 dias)' },
  { id: 'inadimplente', label: 'Inadimplentes' },
  { id: 'trial',        label: 'Em teste' },
  { id: 'cancelado',    label: 'Cancelados' },
]

const STATUS_BADGE = {
  ativo:        'bg-green-500/10 text-green-400 border-green-500/20',
  trial:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  inadimplente: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelado:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
  incompleta:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pausada:      'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—'
}

export default function AdminEscritoriosPage() {
  const toast = useToast()
  const [filtro, setFiltro] = useState('')
  const [busca,  setBusca]  = useState('')
  const [selecionadoId, setSelecionadoId] = useState(null)

  const params = { limit: 50, ...(filtro ? { status: filtro } : {}), ...(busca ? { busca } : {}) }
  const { data, loading, error, refetch } = useApi(() => superAdminService.escritorios(params), [filtro, busca])
  const { data: detalhe, loading: lDetalhe } = useApi(
    () => selecionadoId ? superAdminService.detalheEscritorio(selecionadoId) : Promise.resolve(null),
    [selecionadoId]
  )
  const { execute } = useAction()

  const escritorios = data?.data || []

  async function handleAlterarStatus(id, novoStatus) {
    await execute(() => superAdminService.alterarStatus(id, novoStatus), {
      onSuccess: () => { toast.success('Status atualizado.'); refetch() },
      onError: msg => toast.error(msg),
    })
  }

  if (loading && !data) return <div className="p-6"><LoadingScreen /></div>
  if (error)             return <div className="p-6"><ErrorBlock message={error} onRetry={refetch} /></div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Escritórios</h1>
          <p className="text-sm text-gray-500">{escritorios.length} de {data?.meta?.total || 0} no total</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
          <Search size={13} className="text-gray-500" />
          <input className="text-sm bg-transparent text-gray-200 placeholder-gray-500 outline-none w-48"
            placeholder="Buscar por nome ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filtro === f.id
                ? 'bg-white text-gray-900 border-white'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {escritorios.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">Nenhum escritório encontrado.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {escritorios.map(e => (
              <div key={e.id}
                onClick={() => setSelecionadoId(e.id)}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/40 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{e.email}</p>
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                  <Users size={11}/>{e.total_usuarios}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden md:inline">{formatCurrency(e.valor_mensal)}/mês</span>
                <span className="text-xs text-gray-500 flex-shrink-0 hidden lg:inline">vence {formatDate(e.proximo_venc)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_BADGE[e.assinatura_status] || STATUS_BADGE.cancelado}`}>
                  {e.assinatura_status || 'sem assinatura'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer de detalhe */}
      {selecionadoId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelecionadoId(null)} />
          <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto p-6">
            <button onClick={() => setSelecionadoId(null)} className="absolute top-5 right-5 text-gray-500 hover:text-white">
              <X size={18}/>
            </button>

            {lDetalhe || !detalhe ? (
              <div className="h-40 bg-gray-800 rounded-xl animate-pulse mt-8"/>
            ) : (
              <>
                <p className="text-base font-semibold text-white mb-1">{detalhe.escritorio.nome}</p>
                <p className="text-xs text-gray-500 mb-5">{detalhe.escritorio.email}</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500">Clientes</p>
                    <p className="text-lg font-semibold text-white">{detalhe.contadores.total_clientes}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500">Processos</p>
                    <p className="text-lg font-semibold text-white">{detalhe.contadores.total_processos}</p>
                  </div>
                </div>

                <p className="text-xs font-medium text-gray-300 mb-2">Status do escritório</p>
                <div className="flex gap-2 mb-5">
                  {['ativo', 'bloqueado'].map(s => (
                    <button key={s} onClick={() => handleAlterarStatus(detalhe.escritorio.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        detalhe.escritorio.status === s
                          ? 'bg-white text-gray-900 border-white'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                      }`}>
                      {s === 'ativo' ? 'Ativo' : 'Bloqueado'}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-medium text-gray-300 mb-2">Histórico de assinaturas</p>
                <div className="space-y-2 mb-5">
                  {detalhe.assinaturas.length === 0 && <p className="text-xs text-gray-500">Nenhuma assinatura registrada.</p>}
                  {detalhe.assinaturas.map(a => (
                    <div key={a.id} className="bg-gray-800/50 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 font-medium">{a.plano}</span>
                        <span className={`px-1.5 py-0.5 rounded-full border text-[10px] ${STATUS_BADGE[a.status] || STATUS_BADGE.cancelado}`}>{a.status}</span>
                      </div>
                      <p className="text-gray-500">{formatCurrency(a.valor_mensal)}/mês · próx. venc. {formatDate(a.proximo_venc)}</p>
                      {a.cupom_aplicado && <p className="text-gray-500 mt-0.5">Cupom: {a.cupom_aplicado}</p>}
                    </div>
                  ))}
                </div>

                <p className="text-xs font-medium text-gray-300 mb-2">Usuários ({detalhe.usuarios.length})</p>
                <div className="space-y-1.5">
                  {detalhe.usuarios.map(u => (
                    <div key={u.id} className="flex items-center justify-between text-xs bg-gray-800/50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-gray-200">{u.nome}</p>
                        <p className="text-gray-500">{u.email}</p>
                      </div>
                      <span className="text-gray-500">{u.cargo}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
