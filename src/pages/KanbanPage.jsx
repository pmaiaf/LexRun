import { useState } from 'react'
import { Plus, Clock, MoreHorizontal, ExternalLink, Tag as TagIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApi, useAction } from '../hooks/useApi.js'
import { processosService, tagsService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, useToast, Modal, FormField, TagBadges, TagPicker } from '../components/ui/index.jsx'
import TagsManagerModal from '../components/ui/TagsManagerModal.jsx'
import { prioridadeClass, prazoLabel } from '../utils/helpers.js'

// ── Colunas com terminologia jurídica ────────────────────────────────────────
const COLUNAS = [
  {
    id:    'Novo',
    label: 'Distribuição',
    sub:   'Processos recém-recebidos aguardando triagem',
    color: 'bg-gray-50',
    dot:   'bg-gray-400',
  },
  {
    id:    'Em Andamento',
    label: 'Instrução Processual',
    sub:   'Em trâmite ativo — petições, audiências, diligências',
    color: 'bg-blue-50/50',
    dot:   'bg-blue-500',
  },
  {
    id:    'Aguardando',
    label: 'Aguardando Decisão',
    sub:   'Conclusos ao juiz ou aguardando manifestação da parte',
    color: 'bg-amber-50/40',
    dot:   'bg-amber-500',
  },
  {
    id:    'Concluído',
    label: 'Arquivado / Encerrado',
    sub:   'Trânsito em julgado, acordo homologado ou encerramento',
    color: 'bg-green-50/30',
    dot:   'bg-green-500',
  },
]

export default function KanbanPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => processosService.listar({ limit: 200 }), [])
  const { execute } = useAction()
  const [dragging,   setDragging]   = useState(null)
  const [over,       setOver]       = useState(null)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [form,       setForm]       = useState({ titulo: '', area: '', prioridade: 'Médio', prazo: '' })
  const [saving,     setSaving]     = useState(false)
  const [localMoves, setLocalMoves] = useState({}) // { [id]: novoStatus } para optimistic UI
  const [modalTags,  setModalTags]  = useState(false)
  const [localTags,  setLocalTags]  = useState({}) // { [processoId]: [tags] } para resposta instantânea no card

  const { data: todasTags, refetch: refetchTags } = useApi(() => tagsService.listar(), [])

  const processos = (data?.data || []).map(p => ({
    ...p,
    status: localMoves[p.id] || p.status,
    tags:   localTags[p.id]  || p.tags || [],
  }))

  const getByCol = (colId) => processos.filter(p => p.status === colId)

  async function handleToggleTag(processo, tag, atribuir) {
    try {
      if (atribuir) {
        await tagsService.atribuirProcesso(processo.id, tag.id)
      } else {
        await tagsService.removerDeProcesso(processo.id, tag.id)
      }
      setLocalTags(prev => {
        const atuais = prev[processo.id] || processo.tags || []
        return {
          ...prev,
          [processo.id]: atribuir ? [...atuais, tag] : atuais.filter(t => t.id !== tag.id),
        }
      })
    } catch (err) { toast.error(err.message) }
  }

  async function onDrop(colId) {
    if (!dragging || dragging.status === colId) { setDragging(null); setOver(null); return }

    // Optimistic update — move imediatamente na UI
    setLocalMoves(prev => ({ ...prev, [dragging.id]: colId }))
    setDragging(null); setOver(null)

    try {
      await execute(() => processosService.atualizar(dragging.id, { status: colId }))
    } catch {
      // Rollback em caso de erro
      setLocalMoves(prev => { const n={...prev}; delete n[dragging?.id]; return n })
      toast.error('Falha ao mover processo. Tente novamente.')
      refetch()
    }
  }

  async function handleCriar(e) {
    e.preventDefault(); setSaving(true)
    try {
      await processosService.criar(form)
      toast.success('Processo criado!')
      setModalOpen(false)
      setForm({ titulo: '', area: '', prioridade: 'Médio', prazo: '' })
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Kanban Jurídico</h1>
          <p className="text-sm text-gray-500">{processos.length} processos · arraste para mover entre fases</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalTags(true)} className="btn-secondary flex items-center gap-1.5">
            <TagIcon size={14}/> Etiquetas
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Novo processo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-1 overflow-hidden min-h-0">
        {COLUNAS.map(col => {
          const cards = getByCol(col.id)
          const isOver = over === col.id
          return (
            <div key={col.id}
              className={`flex flex-col rounded-xl border overflow-hidden transition-all
                ${col.color}
                ${isOver ? 'border-brand-400 ring-2 ring-brand-200' : 'border-gray-100'}`}
              onDragOver={e => { e.preventDefault(); setOver(col.id) }}
              onDragLeave={() => setOver(null)}
              onDrop={() => onDrop(col.id)}
            >
              {/* Cabeçalho da coluna */}
              <div className="px-3 py-3 bg-white/70 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`}/>
                    <span className="text-xs font-semibold text-gray-800">{col.label}</span>
                  </div>
                  <span className="text-[10px] bg-white border border-gray-100 px-1.5 py-0.5 rounded-full text-gray-500 font-medium">
                    {cards.length}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight pl-4">{col.sub}</p>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map(p => {
                  const { label: pLabel, class: pCls } = prazoLabel(p.prazo)
                  const isDragging = dragging?.id === p.id
                  return (
                    <div key={p.id} draggable
                      onDragStart={() => setDragging(p)}
                      onDragEnd={() => { setDragging(null); setOver(null) }}
                      className={`bg-white rounded-lg border border-gray-100 p-3 select-none transition-all
                        ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-grab hover:shadow-sm hover:border-gray-200'}`}
                    >
                      {/* Título + link */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs font-semibold text-gray-800 leading-snug flex-1">{p.titulo}</p>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/processos/${p.id}`) }}
                          title="Abrir processo"
                          className="text-gray-300 hover:text-brand-600 flex-shrink-0 mt-0.5 transition-colors"
                        >
                          <ExternalLink size={12}/>
                        </button>
                      </div>

                      {/* Cliente */}
                      <p className="text-[10px] text-gray-400 mb-2 truncate">{p.cliente_nome || '—'}</p>

                      {/* Tags */}
                      <div className="flex items-center gap-1 mb-2 flex-wrap" onClick={e => e.stopPropagation()}>
                        <TagBadges tags={p.tags} />
                        <TagPicker
                          todasTags={todasTags || []}
                          tagsAtuais={p.tags || []}
                          onToggle={(tag, atribuir) => handleToggleTag(p, tag, atribuir)}
                          onCriarNova={() => setModalTags(true)}
                          trigger={<button type="button" className="text-[10px] text-gray-300 hover:text-gray-500">+tag</button>}
                        />
                      </div>

                      {/* Badges */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className={`badge text-[10px] ${prioridadeClass(p.prioridade)}`}>{p.prioridade}</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <Clock size={10}/>{parseFloat(p.horas_total || 0).toFixed(1)}h
                          </span>
                          {p.prazo && <span className={`badge text-[10px] ${pCls}`}>{pLabel}</span>}
                        </div>
                      </div>

                      {/* Footer */}
                      {(p.area || p.responsavel_nome) && (
                        <div className="mt-2 pt-1.5 border-t border-gray-50 flex items-center gap-1">
                          {p.area && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p.area}</span>}
                          {p.responsavel_nome && (
                            <span className="text-[10px] text-gray-400 ml-auto truncate">
                              {p.responsavel_nome.replace(/Dr[a]?\.\s*/,'').split(' ')[0]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {cards.length === 0 && (
                  <div className={`text-center py-8 border-2 border-dashed rounded-xl ${isOver ? 'border-brand-300 bg-brand-50' : 'border-gray-100'}`}>
                    <p className="text-xs text-gray-400">Solte aqui para mover</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal novo processo */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Distribuir novo processo">
        <form onSubmit={handleCriar} className="space-y-4">
          <FormField label="Título / Partes" required>
            <input className="input" placeholder="Ex: Silva vs. Banco Nacional"
              value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required/>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Área do Direito">
              <select className="input" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}>
                {['','Cível','Trabalhista','Família','Imobiliário','Tributário','Empresarial','Previdenciário','Criminal','Consumidor'].map(a=><option key={a}>{a}</option>)}
              </select>
            </FormField>
            <FormField label="Urgência">
              <select className="input" value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                {['Alta','Médio','Baixo'].map(p=><option key={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Prazo fatal / Audiência">
            <input type="date" className="input" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}/>
          </FormField>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
              Distribuir processo
            </button>
          </div>
        </form>
      </Modal>

      <TagsManagerModal
        open={modalTags}
        onClose={() => setModalTags(false)}
        tags={todasTags}
        onChanged={() => refetchTags()}
      />
    </div>
  )
}
