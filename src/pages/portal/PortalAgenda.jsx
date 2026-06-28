import { useApi } from '../../hooks/useApi.js'
import { portalService } from '../../services/api.js'
import { LoadingScreen, ErrorBlock, EmptyState } from '../../components/ui/index.jsx'
import { formatDatetime } from '../../utils/helpers.js'
import { Calendar, Gavel, Clock, Users } from 'lucide-react'

const ICONE_POR_TIPO = {
  'Audiência': Gavel,
  'Prazo':     Clock,
  'Reunião':   Users,
  'Outros':    Calendar,
}

const COR_POR_TIPO = {
  'Audiência': 'bg-red-50 text-red-600',
  'Prazo':     'bg-amber-50 text-amber-600',
  'Reunião':   'bg-brand-50 text-brand-700',
  'Outros':    'bg-gray-50 text-gray-500',
}

export default function PortalAgenda() {
  const { data, loading, error, refetch } = useApi(() => portalService.agenda(), [])
  const lista = Array.isArray(data) ? data : []

  const agora = new Date()
  const proximos = lista.filter(e => new Date(e.data_hora) >= agora)
  const passados  = lista.filter(e => new Date(e.data_hora) < agora)

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Agenda</h1>
        <p className="text-sm text-gray-500">Compromissos relacionados aos seus processos</p>
      </div>

      <div className="card overflow-hidden">
        {lista.length === 0 ? (
          <EmptyState icon={Calendar} title="Nenhum compromisso encontrado"
            subtitle="Audiências, reuniões e prazos relacionados aos seus processos aparecerão aqui" />
        ) : (
          <>
            {proximos.length > 0 && (
              <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Próximos</p>
              </div>
            )}
            {proximos.map(ev => <ItemAgenda key={ev.id} evento={ev} />)}

            {passados.length > 0 && (
              <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Anteriores</p>
              </div>
            )}
            {passados.map(ev => <ItemAgenda key={ev.id} evento={ev} passado />)}
          </>
        )}
      </div>
    </div>
  )
}

function ItemAgenda({ evento, passado }) {
  const Icone = ICONE_POR_TIPO[evento.tipo] || Calendar
  return (
    <div className={`flex items-start gap-4 px-5 py-4 border-b border-gray-50 ${passado ? 'opacity-60' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${COR_POR_TIPO[evento.tipo] || 'bg-gray-50 text-gray-500'}`}>
        <Icone size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800">{evento.titulo}</p>
          <span className="badge badge-gray text-[10px]">{evento.tipo}</span>
        </div>
        {evento.processo_titulo && (
          <p className="text-xs text-gray-400 mt-0.5">
            Processo: {evento.processo_titulo}{evento.processo_numero && ` (${evento.processo_numero})`}
          </p>
        )}
        {evento.descricao && <p className="text-xs text-gray-500 mt-1">{evento.descricao}</p>}
        {evento.local && <p className="text-xs text-gray-400 mt-1">📍 {evento.local}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-gray-700">{formatDatetime(evento.data_hora)}</p>
      </div>
    </div>
  )
}
