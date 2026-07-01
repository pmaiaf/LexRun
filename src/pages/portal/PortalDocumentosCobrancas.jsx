import { useApi } from '../../hooks/useApi.js'
import { portalService } from '../../services/api.js'
import { LoadingScreen, ErrorBlock, EmptyState } from '../../components/ui/index.jsx'
import { formatCurrency, formatDate } from '../../utils/helpers.js'
import { FileText, DollarSign, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'

// ── Documentos ────────────────────────────────────────────────────────────────
export function PortalDocumentos() {
  // Busca documentos de todos os processos
  const { data: processos, loading: l1 }  = useApi(() => portalService.processos(), [])
  const lista = Array.isArray(processos) ? processos : []

  // Agrega documentos de cada processo
  const { data: todosDocsData, loading: l2, error, refetch } = useApi(
    async () => {
      if (!lista.length) return []
      const todos = await Promise.all(lista.map(p => portalService.documentos(p.id)))
      return todos.flat()
    },
    [lista.length]
  )

  const docs = (Array.isArray(todosDocsData) ? todosDocsData : [])
    .filter(d => d.visivel_cliente)

  if (l1 || l2) return <LoadingScreen />
  if (error)    return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 md:p-8">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Documentos</h1>
        <p className="text-sm text-gray-500">{docs.length} documento{docs.length !== 1 ? 's' : ''} disponível{docs.length !== 1 ? 'is' : ''}</p>
      </div>

      <div className="card overflow-hidden">
        {docs.length === 0
          ? <EmptyState icon={FileText} title="Nenhum documento disponível"
              subtitle="Seu advogado ainda não compartilhou documentos com você" />
          : docs.map(doc => (
            <a key={doc.id} href={portalService.downloadDoc(doc.id)} target="_blank" rel="noreferrer"
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Adicionado em {formatDate(doc.criado_em)}
                  {doc.tamanho_bytes && ` · ${(doc.tamanho_bytes / 1024).toFixed(0)} KB`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-brand-600 group-hover:text-brand-800 transition-colors">
                <Download size={15} />
                <span className="text-xs font-medium">Baixar</span>
              </div>
            </a>
          ))
        }
      </div>
    </div>
  )
}

// ── Cobranças ─────────────────────────────────────────────────────────────────
const STATUS_ICON = {
  'Pago':       <CheckCircle size={16} className="text-green-500" />,
  'Atrasado':   <AlertCircle size={16} className="text-red-500" />,
  'Vence hoje': <AlertCircle size={16} className="text-amber-500" />,
  'Pendente':   <Clock       size={16} className="text-gray-400" />,
}

const STATUS_CLS = {
  'Pago':       'badge-green',
  'Atrasado':   'badge-red',
  'Vence hoje': 'badge-amber',
  'Pendente':   'badge-gray',
  'Cancelado':  'badge-gray',
}

export function PortalCobrancas() {
  const { data, loading, error, refetch } = useApi(() => portalService.cobrancas(), [])
  const lista = Array.isArray(data) ? data : []

  const totalPendente = lista
    .filter(c => c.status !== 'Pago' && c.status !== 'Cancelado')
    .reduce((a, c) => a + parseFloat(c.valor || 0), 0)

  const totalPago = lista
    .filter(c => c.status === 'Pago')
    .reduce((a, c) => a + parseFloat(c.valor || 0), 0)

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Cobranças</h1>
        <p className="text-sm text-gray-500">{lista.length} cobrança{lista.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={15} className="text-amber-500" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">A pagar</p>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPendente)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {lista.filter(c => c.status !== 'Pago' && c.status !== 'Cancelado').length} cobrança(s) pendente(s)
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={15} className="text-green-500" />
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Já pago</p>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPago)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {lista.filter(c => c.status === 'Pago').length} cobrança(s) quitada(s)
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {lista.length === 0
          ? <EmptyState icon={DollarSign} title="Nenhuma cobrança encontrada"
              subtitle="Suas cobranças aparecerão aqui quando geradas pelo escritório" />
          : lista.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
              <div className="flex-shrink-0">
                {STATUS_ICON[c.status] || <DollarSign size={16} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{c.descricao}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>Venc. {formatDate(c.vencimento)}</span>
                  <span>{c.metodo}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.valor)}</p>
                <span className={`badge text-[10px] mt-1 ${STATUS_CLS[c.status] || 'badge-gray'}`}>{c.status}</span>
              </div>
              {c.link_pagamento && c.status !== 'Pago' && (
                <a href={c.link_pagamento} target="_blank" rel="noreferrer"
                  className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">
                  Pagar
                </a>
              )}
            </div>
          ))
        }
      </div>

      {/* Aviso */}
      <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-800">
        <p className="font-medium mb-1">Dúvidas sobre cobranças?</p>
        <p className="text-brand-600 text-xs">Entre em contato com seu advogado para esclarecer qualquer questão sobre os valores apresentados.</p>
      </div>
    </div>
  )
}
