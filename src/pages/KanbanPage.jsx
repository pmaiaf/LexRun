import { useState, useEffect } from 'react'
import {
  Plus, X, Trash2, Calendar, MapPin, User, Briefcase, Loader2, GripVertical, Filter,
} from 'lucide-react'
import { useApi, useAction } from '../hooks/useApi.js'
import { agendaService, clientesService, processosService } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog } from '../components/ui/index.jsx'

const COLUNAS = [
  { id: 'a_fazer',   label: 'A Fazer',  cor: 'border-t-gray-300' },
  { id: 'fazendo',   label: 'Fazendo',  cor: 'border-t-brand-400' },
  { id: 'concluido', label: 'Concluído', cor: 'border-t-green-400' },
]
const TIPOS = ['Tarefa', 'Evento', 'Prazo', 'Audiência', 'Reunião', 'Outros']
const TIPO_COLOR = {
  'Tarefa':    'bg-purple-50 text-purple-700 border-purple-100',
  'Evento':    'bg-blue-50 text-blue-700 border-blue-100',
  'Audiência': 'bg-red-50 text-red-700 border-red-100',
  'Prazo':     'bg-amber-50 text-amber-700 border-amber-100',
  'Reunião':   'bg-teal-50 text-teal-700 border-teal-100',
  'Outros':    'bg-gray-50 text-gray-600 border-gray-100',
}

function fmtData(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const atrasada = (a) => a.data_hora && a.status !== 'concluido' && new Date(a.data_hora) < new Date()

export default function KanbanPage() {
  const toast = useToast()
  const { execute } = useAction()
  const { data, loading, error, refetch } = useApi(() => agendaService.atividades(), [])

  const [items, setItems] = useState([])
  useEffect(() => { setItems(Array.isArray(data) ? data : []) }, [data])

  const [filtroTipo, setFiltroTipo] = useState('')
  const [modal, setModal] = useState(null)        // { atividade } | { novo: status }
  const [confirmDel, setConfirmDel] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const visiveis = filtroTipo ? items.filter(a => a.tipo === filtroTipo) : items
  const porColuna = (colId) => visiveis.filter(a => (a.status || 'a_fazer') === colId)

  const mover = async (id, status) => {
    const atual = items.find(a => a.id === id)
    if (!atual || atual.status === status) return
    setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a))   // otimista
    try { await execute(() => agendaService.atualizar(id, { status })) }
    catch (e) { toast.error('Não foi possível mover.'); refetch() }
  }
  const onDrop = (colId) => { setOverCol(null); if (dragId) mover(dragId, colId); setDragId(null) }

  const excluir = (a) => execute(() => agendaService.remover(a.id), {
    onSuccess: () => { toast.success('Atividade excluída.'); setConfirmDel(null); setModal(null); refetch() },
    onError: (m) => { toast.error(m); setConfirmDel(null) },
  })

  if (loading && !data) return <LoadingScreen />
  if (error && !data)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kanban</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tarefas, prazos, audiências e eventos do escritório.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
            <Filter size={14} className="text-gray-400" />
            <select className="text-sm bg-transparent outline-none text-gray-700" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={() => setModal({ novo: 'a_fazer' })} className="btn-primary !py-2 flex items-center gap-1.5"><Plus size={16} /> Nova atividade</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUNAS.map(col => {
          const lista = porColuna(col.id)
          return (
            <div key={col.id}
              onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
              onDragLeave={() => setOverCol(o => o === col.id ? null : o)}
              onDrop={() => onDrop(col.id)}
              className={`rounded-xl bg-gray-50/70 border-t-2 ${col.cor} p-3 min-h-[300px] transition-colors ${overCol === col.id ? 'ring-2 ring-brand-200 bg-brand-50/30' : ''}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-medium text-gray-700">{col.label} <span className="text-gray-400">{lista.length}</span></span>
                <button onClick={() => setModal({ novo: col.id })} className="text-gray-400 hover:text-brand-700 p-0.5" title="Nova atividade aqui"><Plus size={15} /></button>
              </div>
              <div className="space-y-2">
                {lista.map(a => (
                  <AtividadeCard key={a.id} a={a}
                    onClick={() => setModal({ atividade: a })}
                    onDragStart={() => setDragId(a.id)} onDragEnd={() => setDragId(null)} />
                ))}
                {lista.length === 0 && <p className="text-center text-xs text-gray-400 py-8">Arraste atividades para cá ou clique em +</p>}
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <AtividadeModal
          atividade={modal.atividade}
          statusInicial={modal.novo}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch() }}
          onAskDelete={(a) => setConfirmDel(a)} />
      )}
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => excluir(confirmDel)} danger
        title="Excluir atividade?" description="Esta ação não pode ser desfeita." />
    </div>
  )
}

function AtividadeCard({ a, onClick, onDragStart, onDragEnd }) {
  const cor = TIPO_COLOR[a.tipo] || TIPO_COLOR.Outros
  const late = atrasada(a)
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      className="group bg-white rounded-lg border border-gray-100 p-3 cursor-pointer hover:border-brand-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-gray-200 group-hover:text-gray-300 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`badge text-[10px] border ${cor}`}>{a.tipo}</span>
            {late && <span className="badge text-[10px] bg-red-50 text-red-600 border border-red-100">atrasada</span>}
          </div>
          <p className="text-sm text-gray-800 font-medium leading-snug break-words">{a.titulo}</p>
          <div className="mt-1.5 space-y-0.5">
            {a.data_hora && <p className={`text-xs flex items-center gap-1 ${late ? 'text-red-500' : 'text-gray-400'}`}><Calendar size={11} /> {fmtData(a.data_hora)}</p>}
            {a.local && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} /> {a.local}</p>}
            {(a.cliente_nome || a.processo_numero) && (
              <p className="text-xs text-gray-400 flex items-center gap-1"><Briefcase size={11} /> {a.cliente_nome || a.processo_numero}</p>
            )}
            {a.responsavel_nome && <p className="text-xs text-gray-400 flex items-center gap-1"><User size={11} /> {a.responsavel_nome}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function AtividadeModal({ atividade, statusInicial, onClose, onSaved, onAskDelete }) {
  const toast = useToast()
  const { user } = useAuth()
  const { execute, loading } = useAction()
  const edit = !!atividade

  const { data: cliData } = useApi(() => clientesService.listar({ limit: 200 }), [])
  const { data: procData } = useApi(() => processosService.listar({ limit: 200 }), [])
  const clientes = cliData?.data || cliData?.clientes || []
  const processos = procData?.data || procData?.processos || []

  const toLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso); const off = d.getTimezoneOffset()
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
  }

  const [form, setForm] = useState(() => ({
    titulo: atividade?.titulo || '',
    tipo: atividade?.tipo || 'Tarefa',
    status: atividade?.status || statusInicial || 'a_fazer',
    data_hora: toLocal(atividade?.data_hora),
    local: atividade?.local || '',
    descricao: atividade?.descricao || '',
    cliente_id: atividade?.cliente_id || '',
    processo_id: atividade?.processo_id || '',
    avisar_cliente: false,
  }))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const salvar = () => {
    if (!form.titulo.trim()) { toast.error('Informe o título.'); return }
    const payload = {
      titulo: form.titulo.trim(), tipo: form.tipo, status: form.status,
      data_hora: form.data_hora || null, local: form.local || null,
      descricao: form.descricao || null,
      cliente_id: form.cliente_id || null, processo_id: form.processo_id || null,
      responsavel_id: atividade?.responsavel_id || user?.id || null,
      avisar_cliente: !!form.avisar_cliente && !!form.cliente_id,
    }
    const fn = edit ? () => agendaService.atualizar(atividade.id, payload) : () => agendaService.criar(payload)
    execute(fn, {
      onSuccess: () => { toast.success(edit ? 'Atividade atualizada.' : 'Atividade criada.'); onSaved() },
      onError: (m) => toast.error(m),
    })
  }

  return (
    <Modal open onClose={onClose} title={edit ? 'Atividade' : 'Nova atividade'} size="md">
      <div className="space-y-4">
        <FormField label="Título" required>
          <input className="input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex.: Audiência de instrução" autoFocus />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo">
            <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Coluna">
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {COLUNAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data e hora (opcional)">
            <input type="datetime-local" className="input" value={form.data_hora} onChange={e => set('data_hora', e.target.value)} />
          </FormField>
          <FormField label="Local">
            <input className="input" value={form.local} onChange={e => set('local', e.target.value)} placeholder="Vara, fórum, videoconferência…" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cliente (opcional)">
            <select className="input" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
              <option value="">—</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Processo (opcional)">
            <select className="input" value={form.processo_id} onChange={e => set('processo_id', e.target.value)}>
              <option value="">—</option>
              {processos.map(p => <option key={p.id} value={p.id}>{p.numero || p.titulo}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Observações">
          <textarea className="input min-h-[70px]" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Anotações sobre a atividade…" />
        </FormField>

        {form.cliente_id && form.data_hora && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.avisar_cliente} onChange={e => set('avisar_cliente', e.target.checked)} className="accent-brand-700" />
            Avisar o cliente por e-mail sobre este compromisso
          </label>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>{edit && <button onClick={() => onAskDelete(atividade)} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1.5"><Trash2 size={14} /> Excluir</button>}</div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={salvar} disabled={loading} className="btn-primary flex items-center gap-1.5">
            {loading && <Loader2 size={14} className="animate-spin" />} {edit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
