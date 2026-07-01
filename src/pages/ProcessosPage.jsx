import { useState } from 'react'
import { Plus, Search, X, ExternalLink, MoreVertical, Edit2, Trash2, AlignJustify, List, Star, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApi, useAction } from '../hooks/useApi.js'
import { processosService, tagsService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog, EmptyState, TagBadges, TagPicker } from '../components/ui/index.jsx'
import TagsManagerModal from '../components/ui/TagsManagerModal.jsx'
import { formatCurrency, formatDate, prazoLabel, prioridadeClass } from '../utils/helpers.js'
import { maskProcessoCnj } from '../utils/masks.js'
import { DicaDaTela } from '../components/Onboarding.jsx'
import { Briefcase } from 'lucide-react'

const AREAS   = ['','Cível','Trabalhista','Família','Imobiliário','Tributário','Empresarial','Previdenciário']
const STATUS  = ['','Novo','Em Andamento','Aguardando','Concluído']
const statusClass = s => ({ 'Novo':'bg-gray-100 text-gray-600','Em Andamento':'bg-gray-100 text-gray-600','Aguardando':'bg-gray-100 text-gray-600','Concluído':'bg-green-50 text-green-700' }[s] || 'bg-gray-100 text-gray-600')

export default function ProcessosPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState({ busca: '', status: '', area: '', tag_id: '' })
  const [tagsModalOpen, setTagsModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ titulo: '', numero: '', area: '', prioridade: 'Médio', prazo: '', honorarios: '', descricao: '' })
  const [tagsForm, setTagsForm] = useState([])
  const [compacto, setCompacto] = useState(false)
  const [menuAbertoId, setMenuAbertoId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { execute: execDelete, loading: deleting } = useAction()

  const { data: todasTags, refetch: refetchTags } = useApi(() => tagsService.listar(), [])

  const params = Object.fromEntries(Object.entries({ status: filtros.status, area: filtros.area, busca: filtros.busca, tag_id: filtros.tag_id, limit: 100 }).filter(([,v]) => v))
  const { data, loading, error, refetch } = useApi(() => processosService.listar(params), [filtros.status, filtros.area, filtros.busca, filtros.tag_id])
  const processos = data?.data || []

  async function toggleImportante(p, e) {
    e.stopPropagation()
    try { await processosService.atualizar(p.id, { importante: !p.importante }); refetch() }
    catch (err) { toast.error(err.message) }
  }

  async function handleCriar(e) {
    e.preventDefault(); setSaving(true)
    try {
      const novo = await processosService.criar({ ...form, honorarios: form.honorarios ? parseFloat(form.honorarios) : undefined })
      for (const tag of tagsForm) {
        await tagsService.atribuirProcesso(novo.id, tag.id)
      }
      toast.success('Processo criado com sucesso!')
      setModalOpen(false); setForm({ titulo: '', numero: '', area: '', prioridade: 'Médio', prazo: '', honorarios: '', descricao: '' }); setTagsForm([])
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    await execDelete(() => processosService.remover(confirmDelete.id), {
      onSuccess: () => { toast.success('Processo removido.'); setConfirmDelete(null); setSelected(null); refetch() },
      onError: (msg) => toast.error(msg),
    })
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  const padY = compacto ? 'py-1.5' : 'py-3'

  return (
    <div className="p-6">
      <DicaDaTela chave="processos" titulo="Esta é a tela de Processos">Aqui você cadastra e acompanha todos os processos do escritório. Clique em "Novo processo" para começar. Informe o número CNJ para sincronizar movimentações com os tribunais automaticamente.</DicaDaTela>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Processos</h1>
          <p className="text-sm text-gray-500">{processos.length} encontrado{processos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCompacto(v => !v)}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title={compacto ? 'Visão normal' : 'Visão compacta'}>
            {compacto ? <List size={13}/> : <AlignJustify size={13}/>}
            {compacto ? 'Visão normal' : 'Visão compacta'}
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Novo processo
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={13} className="text-gray-400" />
          <input className="text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 bg-transparent"
            placeholder="Buscar..." value={filtros.busca}
            onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))} />
          {filtros.busca && <button onClick={() => setFiltros(f => ({...f, busca:''}))}><X size={12} className="text-gray-400" /></button>}
        </div>
        <select className="input w-auto text-sm" value={filtros.area} onChange={e => setFiltros(f => ({...f, area: e.target.value}))}>
          <option value="">Todas as áreas</option>
          {AREAS.filter(Boolean).map(a => <option key={a}>{a}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filtros.status} onChange={e => setFiltros(f => ({...f, status: e.target.value}))}>
          <option value="">Todos os status</option>
          {STATUS.filter(Boolean).map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filtros.tag_id} onChange={e => setFiltros(f => ({...f, tag_id: e.target.value}))}>
          <option value="">Todas as etiquetas</option>
          {(todasTags || []).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <button onClick={() => setTagsModalOpen(true)} className="btn-secondary text-sm flex items-center gap-1.5"><Tag size={14} /> Etiquetas</button>
      </div>

      <div className="card overflow-hidden">
        {processos.length === 0
          ? <EmptyState icon={Briefcase} title="Nenhum processo encontrado" subtitle="Crie seu primeiro processo ou ajuste os filtros" action={<button onClick={() => setModalOpen(true)} className="btn-primary text-xs">+ Novo processo</button>} />
          : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Processo','Cliente','Área','Status','Prazo','Prioridade'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">Honorários</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {processos.map(p => {
                  const { label: pLabel, class: pCls } = prazoLabel(p.prazo)
                  return (
                    <tr key={p.id}
                      onClick={() => navigate(`/processos/${p.id}`)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className={`px-4 ${padY} text-left`}>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => toggleImportante(p, e)} className="p-0.5 flex-shrink-0" title={p.importante ? 'Remover destaque' : 'Marcar como importante'}>
                            <Star size={15} className={p.importante ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'} />
                          </button>
                          <div>
                            <p className="font-medium text-gray-800 group-hover:text-brand-700 transition-colors">{p.titulo}</p>
                            {p.numero && <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{p.numero}</p>}
                            {!compacto && p.tags?.length > 0 && <div className="mt-1"><TagBadges tags={p.tags} /></div>}
                          </div>
                          <ExternalLink size={12} className="text-gray-300 group-hover:text-brand-400 ml-1 flex-shrink-0" />
                        </div>
                      </td>
                      <td className={`px-4 ${padY} text-left text-gray-600 whitespace-nowrap`}>{p.cliente_nome || '—'}</td>
                      <td className={`px-4 ${padY} text-left whitespace-nowrap`}>{p.area ? <span className="badge badge-gray">{p.area}</span> : '—'}</td>
                      <td className={`px-4 ${padY} text-left whitespace-nowrap`}>
                        <span className={`badge ${statusClass(p.status)}`}>{p.status}</span>
                        {p.ativo === false && <span className="badge badge-gray ml-1">Inativo</span>}
                      </td>
                      <td className={`px-4 ${padY} text-left whitespace-nowrap`}>
                        {p.prazo ? <div className="flex items-center gap-1.5"><span className="text-gray-600 text-xs">{formatDate(p.prazo)}</span><span className={`badge ${pCls}`}>{pLabel}</span></div> : '—'}
                      </td>
                      <td className={`px-4 ${padY} text-left whitespace-nowrap`}><span className={`badge ${prioridadeClass(p.prioridade)}`}>{p.prioridade}</span></td>
                      <td className={`px-4 ${padY} text-right text-gray-700 font-medium whitespace-nowrap tabular-nums`}>{p.honorarios ? formatCurrency(p.honorarios) : '—'}</td>
                      <td className={`px-4 ${padY} text-right whitespace-nowrap relative`} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setMenuAbertoId(menuAbertoId === p.id ? null : p.id)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <MoreVertical size={14}/>
                        </button>
                        {menuAbertoId === p.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuAbertoId(null)} />
                            <div className="absolute z-50 right-4 top-full mt-1 w-40 bg-white rounded-xl border border-gray-100 shadow-lg py-1">
                              <button onClick={() => { setMenuAbertoId(null); navigate(`/processos/${p.id}`) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left">
                                <Edit2 size={12}/> Ver / editar
                              </button>
                              <button onClick={() => { setMenuAbertoId(null); setConfirmDelete(p) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left">
                                <Trash2 size={12}/> Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tagsModalOpen && <TagsManagerModal open={tagsModalOpen} onClose={() => setTagsModalOpen(false)} tags={todasTags || []} onChanged={refetchTags} />}

      {/* Painel de detalhe */}
      {selected && (
        <div className="fixed inset-0 bg-black/20 z-40 flex justify-end" onClick={() => setSelected(null)}>
          <div className="w-96 bg-white h-full overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-gray-900">{selected.titulo}</h2>
                  {selected.numero && <p className="text-xs font-mono text-gray-400 mt-1">{selected.numero}</p>}
                  {selected.tags?.length > 0 && <div className="mt-2"><TagBadges tags={selected.tags} /></div>}
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[['Cliente', selected.cliente_nome||'—'],['Área', selected.area||'—'],['Status', selected.status],['Prioridade', selected.prioridade],['Prazo', selected.prazo ? formatDate(selected.prazo) : '—'],['Responsável', selected.responsavel_nome||'—'],['Horas trabalhadas', `${parseFloat(selected.horas_total||0).toFixed(1)}h`],['Honorários', selected.honorarios ? formatCurrency(selected.honorarios) : '—']].map(([k,v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-xs text-gray-500">{k}</span>
                  <span className="text-xs font-medium text-gray-800">{v}</span>
                </div>
              ))}
              {selected.descricao && <p className="text-xs text-gray-500 leading-relaxed">{selected.descricao}</p>}
              <div className="pt-2">
                <button onClick={() => setConfirmDelete(selected)} className="text-xs text-red-500 hover:underline">Remover processo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setTagsForm([]) }} title="Novo processo" size="lg">
        <form onSubmit={handleCriar} className="space-y-4">
          <FormField label="Título" required><input className="input" value={form.titulo} onChange={e => setForm(f=>({...f,titulo:e.target.value}))} required /></FormField>
          <FormField label="Número do processo"><input className="input font-mono" placeholder="0000000-00.0000.0.00.0000" value={form.numero} onChange={e => setForm(f=>({...f,numero:maskProcessoCnj(e.target.value)}))} maxLength={25} /></FormField>
          <FormField label="Etiquetas">
            <div className="flex items-center gap-2 flex-wrap">
              <TagBadges tags={tagsForm} size="sm" />
              <TagPicker todasTags={todasTags || []} tagsAtuais={tagsForm}
                onToggle={(tag, atribuir) => setTagsForm(atual => atribuir ? [...atual, tag] : atual.filter(t => t.id !== tag.id))} />
            </div>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Área"><select className="input" value={form.area} onChange={e => setForm(f=>({...f,area:e.target.value}))}>{AREAS.map(a=><option key={a}>{a}</option>)}</select></FormField>
            <FormField label="Prioridade"><select className="input" value={form.prioridade} onChange={e => setForm(f=>({...f,prioridade:e.target.value}))}>{['Alta','Médio','Baixo'].map(p=><option key={p}>{p}</option>)}</select></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Prazo"><input type="date" className="input" value={form.prazo} onChange={e => setForm(f=>({...f,prazo:e.target.value}))} /></FormField>
            <FormField label="Honorários (R$)"><input type="number" step="0.01" className="input" value={form.honorarios} onChange={e => setForm(f=>({...f,honorarios:e.target.value}))} /></FormField>
          </div>
          <FormField label="Descrição"><textarea className="input resize-none" rows={3} value={form.descricao} onChange={e => setForm(f=>({...f,descricao:e.target.value}))} /></FormField>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setTagsForm([]) }} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}Criar processo
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Remover processo" description={`Tem certeza que deseja remover "${confirmDelete?.titulo}"? Esta ação não pode ser desfeita.`}
        danger loading={deleting} />
    </div>
  )
}
