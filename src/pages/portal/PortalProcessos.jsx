import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, Circle, ChevronRight } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { portalService } from '../../services/api.js'
import { LoadingScreen, ErrorBlock, EmptyState } from '../../components/ui/index.jsx'
import { formatDate, prazoLabel } from '../../utils/helpers.js'
import { FileText } from 'lucide-react'

const statusCls = s => ({
  'Novo':         'bg-gray-100 text-gray-600',
  'Em Andamento': 'bg-blue-50 text-blue-700',
  'Aguardando':   'bg-amber-50 text-amber-700',
  'Concluído':    'bg-green-50 text-green-700',
}[s] || 'bg-gray-100 text-gray-600')

const TL_ICON = {
  done:    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />,
  current: <Clock       size={16} className="text-blue-500  flex-shrink-0" />,
  next:    <Circle      size={16} className="text-gray-300  flex-shrink-0" />,
}

// ── Lista de processos ────────────────────────────────────────────────────────
export function PortalProcessosList() {
  const { data, loading, error, refetch } = useApi(() => portalService.processos(), [])
  const lista = Array.isArray(data) ? data : []

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Meus processos</h1>
        <p className="text-sm text-gray-500">{lista.length} processo{lista.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="card overflow-hidden">
        {lista.length === 0
          ? <EmptyState icon={FileText} title="Nenhum processo encontrado"
              subtitle="Entre em contato com seu advogado para mais informações" />
          : lista.map(p => {
              const { label, class: cls } = prazoLabel(p.prazo)
              return (
                <Link key={p.id} to={`/portal/processos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-brand-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.numero && <p className="text-[11px] text-gray-400 font-mono">{p.numero}</p>}
                      {p.area   && <p className="text-[11px] text-gray-400">· {p.area}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${statusCls(p.status)}`}>{p.status}</span>
                    {p.prazo && <span className={`badge ${cls}`}>{label}</span>}
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                  </div>
                </Link>
              )
            })
        }
      </div>
    </div>
  )
}

// ── Detalhe de um processo ────────────────────────────────────────────────────
export function PortalProcessoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: processo, loading: l1, error: e1, refetch: r1 } = useApi(() => portalService.processo(id), [id])
  const { data: timeline, loading: l2 } = useApi(() => portalService.timeline(id), [id])
  const { data: docs }                  = useApi(() => portalService.documentos(id), [id])

  const [tab, setTab] = useState('timeline')

  if (l1) return <LoadingScreen />
  if (e1) return <ErrorBlock message={e1} onRetry={r1} />
  if (!processo) return null

  const tl   = Array.isArray(timeline) ? timeline.filter(t => t.visivel_cliente !== false) : []
  const docs_ = Array.isArray(docs) ? docs.filter(d => d.visivel_cliente) : []

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/portal/processos')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft size={14} /> Voltar para processos
      </button>

      {/* Header */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-brand-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge ${statusCls(processo.status)}`}>{processo.status}</span>
            </div>
            <h1 className="text-base font-semibold text-gray-900">{processo.titulo}</h1>
            {processo.numero && <p className="text-xs font-mono text-gray-400 mt-0.5">{processo.numero}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Área', processo.area || '—'],
            ['Prazo', processo.prazo ? formatDate(processo.prazo) : '—'],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">{k}</p>
              <p className="text-sm font-medium text-gray-800">{v}</p>
            </div>
          ))}
        </div>

        {processo.descricao && (
          <p className="text-xs text-gray-500 leading-relaxed mt-3 p-3 bg-gray-50 rounded-xl">
            {processo.descricao}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {[['timeline','Linha do tempo'],['documentos','Documentos']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${tab===k?'bg-white text-gray-900 font-medium shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-5">O que está acontecendo no seu processo</p>
          {tl.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Nenhuma atualização disponível ainda.</p>
            : tl.map((item, i) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">{TL_ICON[item.status]}</div>
                  {i < tl.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1.5 ${item.status === 'done' ? 'bg-green-200' : 'bg-gray-100'}`}
                      style={{ minHeight: 28 }} />
                  )}
                </div>
                <div className={`flex-1 pb-5 ${item.status === 'next' ? 'opacity-50' : ''}`}>
                  <p className="text-sm font-medium text-gray-800">{item.titulo}</p>
                  {item.data_evento && (
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.data_evento)}</p>
                  )}
                  {item.descricao && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-gray-50 rounded-lg p-2.5">
                      {item.descricao}
                    </p>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Documentos */}
      {tab === 'documentos' && (
        <div className="card overflow-hidden">
          {docs_.length === 0
            ? <div className="text-center py-10 text-sm text-gray-400">
                Nenhum documento disponível ainda.
              </div>
            : docs_.map(doc => (
              <a key={doc.id} href={portalService.downloadDoc(doc.id)} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.criado_em)}</p>
                </div>
                <span className="text-xs text-brand-600">Baixar →</span>
              </a>
            ))
          }
        </div>
      )}
    </div>
  )
}
