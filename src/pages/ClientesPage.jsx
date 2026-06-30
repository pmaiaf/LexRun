import { useState } from 'react'
import { Plus, Search, X, User, Phone, Mail, FileText, ExternalLink, Lock, Unlock, Trash2, Edit2, ChevronRight, Briefcase, Tag as TagIcon, Calendar, Clock, MapPin, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApi, useAction } from '../hooks/useApi.js'
import { clientesService, processosService, tagsService, agendaService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog, EmptyState, TagBadges, TagPicker } from '../components/ui/index.jsx'
import TagsManagerModal from '../components/ui/TagsManagerModal.jsx'
import { avatarInitials, avatarColor, formatDate, formatDatetime } from '../utils/helpers.js'
import { maskCpfCnpj, maskTelefone, maskCep, maskProcessoCnj, validarCpfCnpj, buscarEnderecoPorCep } from '../utils/masks.js'
import { DicaDaTela } from '../components/Onboarding.jsx'

const TIPOS = ['PF', 'PJ']
const AREAS = ['','Cível','Trabalhista','Família','Imobiliário','Tributário','Empresarial','Previdenciário','Criminal','Consumidor']

// ── Formulário de novo processo com cliente pré-vinculado e bloqueado ────────
function NovoProcessoForm({ clienteNome, onSave, onCancel, saving, todasTags = [], onCriarNovaTag }) {
  const [form, setForm] = useState({ titulo: '', numero: '', area: '', prioridade: 'Médio', prazo: '', honorarios: '' })
  const [tagsSelecionadas, setTagsSelecionadas] = useState([])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleToggleTagLocal(tag, atribuir) {
    setTagsSelecionadas(atual => atribuir ? [...atual, tag] : atual.filter(t => t.id !== tag.id))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form, tagsSelecionadas) }} className="space-y-4">
      <FormField label="Cliente">
        <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={clienteNome} disabled readOnly/>
      </FormField>
      <FormField label="Título / Partes" required>
        <input className="input" placeholder="Ex: Ação de Cobrança"
          value={form.titulo} onChange={e => set('titulo', e.target.value)} required autoFocus/>
      </FormField>
      <FormField label="Número do processo">
        <input className="input font-mono" placeholder="0000000-00.0000.0.00.0000"
          value={form.numero} onChange={e => set('numero', maskProcessoCnj(e.target.value))} maxLength={25}/>
      </FormField>
      <FormField label="Etiquetas">
        <div className="flex items-center gap-2 flex-wrap">
          <TagBadges tags={tagsSelecionadas} size="sm" />
          <TagPicker todasTags={todasTags} tagsAtuais={tagsSelecionadas}
            onToggle={handleToggleTagLocal} onCriarNova={onCriarNovaTag} />
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Área">
          <select className="input" value={form.area} onChange={e => set('area', e.target.value)}>
            {AREAS.map(a => <option key={a}>{a}</option>)}
          </select>
        </FormField>
        <FormField label="Prioridade">
          <select className="input" value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
            {['Alta','Médio','Baixo'].map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Prazo">
          <input type="date" className="input" value={form.prazo} onChange={e => set('prazo', e.target.value)}/>
        </FormField>
        <FormField label="Honorários (R$)">
          <input type="number" step="0.01" className="input" value={form.honorarios} onChange={e => set('honorarios', e.target.value)}/>
        </FormField>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
          Criar processo
        </button>
      </div>
    </form>
  )
}

function ClienteForm({ inicial, onSave, onCancel, saving, todasTags = [], onCriarNovaTag }) {
  const [form, setForm] = useState(inicial || {
    nome: '', email: '', telefone: '', cpf_cnpj: '', tipo: 'PF', observacoes: '',
    cep: '', rua: '', numero: '', bairro: '', cidade: '', uf: '',
  })
  const [tagsSelecionadas, setTagsSelecionadas] = useState(inicial?.tags || [])
  const [erroCpf, setErroCpf] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleToggleTagLocal(tag, atribuir) {
    setTagsSelecionadas(atual =>
      atribuir ? [...atual, tag] : atual.filter(t => t.id !== tag.id)
    )
  }

  function handleCpfChange(v) {
    set('cpf_cnpj', maskCpfCnpj(v))
    setErroCpf('')
  }

  function handleCpfBlur() {
    if (form.cpf_cnpj && !validarCpfCnpj(form.cpf_cnpj)) {
      setErroCpf(form.tipo === 'PJ' ? 'CNPJ inválido.' : 'CPF inválido.')
    }
  }

  async function handleCepChange(v) {
    const masked = maskCep(v)
    set('cep', masked)
    if (masked.replace(/\D/g, '').length === 8) {
      setBuscandoCep(true)
      const endereco = await buscarEnderecoPorCep(masked)
      setBuscandoCep(false)
      if (endereco) {
        setForm(f => ({ ...f, rua: endereco.rua, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf }))
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (form.cpf_cnpj && !validarCpfCnpj(form.cpf_cnpj)) {
      setErroCpf(form.tipo === 'PJ' ? 'CNPJ inválido.' : 'CPF inválido.')
      return
    }
    onSave(form, tagsSelecionadas)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nome completo" required>
          <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} required />
        </FormField>
        <FormField label="Tipo">
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Etiquetas">
        <div className="flex items-center gap-2 flex-wrap">
          <TagBadges tags={tagsSelecionadas} size="sm" />
          <TagPicker todasTags={todasTags} tagsAtuais={tagsSelecionadas}
            onToggle={handleToggleTagLocal} onCriarNova={onCriarNovaTag} />
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="E-mail">
          <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
        </FormField>
        <FormField label="Telefone">
          <input className="input" value={form.telefone} onChange={e => set('telefone', maskTelefone(e.target.value))}
            placeholder="(11) 99999-0000" maxLength={15}/>
        </FormField>
      </div>
      <FormField label={form.tipo === 'PJ' ? 'CNPJ' : 'CPF'} error={erroCpf}>
        <input className="input font-mono" value={form.cpf_cnpj} onChange={e => handleCpfChange(e.target.value)}
          onBlur={handleCpfBlur} placeholder={form.tipo === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'} maxLength={18}/>
      </FormField>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Endereço (opcional)</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FormField label="CEP">
            <div className="relative">
              <input className="input font-mono" value={form.cep} onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000" maxLength={9}/>
              {buscandoCep && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-300 border-t-brand-700 rounded-full animate-spin"/>
              )}
            </div>
          </FormField>
          <FormField label="Número">
            <input className="input" value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="123"/>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FormField label="Rua">
            <input className="input" value={form.rua} onChange={e => set('rua', e.target.value)}/>
          </FormField>
          <FormField label="Bairro">
            <input className="input" value={form.bairro} onChange={e => set('bairro', e.target.value)}/>
          </FormField>
        </div>
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <FormField label="Cidade">
            <input className="input" value={form.cidade} onChange={e => set('cidade', e.target.value)}/>
          </FormField>
          <FormField label="UF">
            <input className="input uppercase" value={form.uf} maxLength={2} onChange={e => set('uf', e.target.value.toUpperCase())}/>
          </FormField>
        </div>
      </div>

      <FormField label="Observações">
        <textarea className="input resize-none" rows={3} value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)} placeholder="Informações adicionais..." />
      </FormField>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {inicial ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
      </div>
    </form>
  )
}

export default function ClientesPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [modalCriar,  setModalCriar]  = useState(false)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalPortal, setModalPortal] = useState(false)
  const [modalNovoProcesso, setModalNovoProcesso] = useState(false)
  const [modalTags, setModalTags] = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [saving, setSaving] = useState(false)
  const { execute: execDel, loading: deleting } = useAction()

  const { data: todasTags, refetch: refetchTags } = useApi(() => tagsService.listar(), [])

  const params = busca ? { busca, limit: 100 } : { limit: 100 }
  const { data, loading, error, refetch } = useApi(() => clientesService.listar(params), [busca])
  async function toggleImportanteCliente(c, e) {
    e.stopPropagation()
    try { await clientesService.atualizar(c.id, { importante: !c.importante }); refetch() }
    catch (err) { toast.error(err.message) }
  }
  const { data: procData, refetch: refetchProcessos } = useApi(
    () => selecionado ? clientesService.processos(selecionado.id) : Promise.resolve([]),
    [selecionado?.id]
  )
  const { data: agendaData, refetch: refetchAgenda } = useApi(
    () => selecionado ? agendaService.listar({ cliente_id: selecionado.id }) : Promise.resolve([]),
    [selecionado?.id]
  )
  const clientes  = data?.data || []
  const processos = procData || []
  const eventosAgenda = agendaData || []

  async function handleToggleTag(tag, atribuir) {
    try {
      if (atribuir) {
        await tagsService.atribuirCliente(selecionado.id, tag.id)
      } else {
        await tagsService.removerDeCliente(selecionado.id, tag.id)
      }
      // Atualiza localmente sem refetch completo para resposta instantânea
      setSelecionado(prev => ({
        ...prev,
        tags: atribuir
          ? [...(prev.tags || []), tag]
          : (prev.tags || []).filter(t => t.id !== tag.id),
      }))
      refetch() // mantém a lista lateral sincronizada
    } catch (err) { toast.error(err.message) }
  }

  async function handleCriar(form, tags = []) {
    setSaving(true)
    try {
      const novo = await clientesService.criar(form)
      // O cliente só existe no banco a partir daqui — as tags selecionadas
      // no formulário são persistidas agora, uma a uma, contra o ID real.
      for (const tag of tags) {
        await tagsService.atribuirCliente(novo.id, tag.id)
      }
      toast.success('Cliente cadastrado!')
      setModalCriar(false)
      refetch()
      refetchTags()
      setSelecionado({ ...novo, tags })
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleEditar(form, tags = []) {
    setSaving(true)
    try {
      const atualizado = await clientesService.atualizar(modalEditar.id, form)
      // Sincroniza tags: remove as que saíram, adiciona as novas — evita
      // apagar tudo e recriar, preservando criado_em das que permanecem.
      const idsAntes = new Set((modalEditar.tags || []).map(t => t.id))
      const idsDepois = new Set(tags.map(t => t.id))
      for (const tag of tags) {
        if (!idsAntes.has(tag.id)) await tagsService.atribuirCliente(modalEditar.id, tag.id)
      }
      for (const tag of (modalEditar.tags || [])) {
        if (!idsDepois.has(tag.id)) await tagsService.removerDeCliente(modalEditar.id, tag.id)
      }
      toast.success('Cliente atualizado!')
      setModalEditar(null)
      refetch()
      setSelecionado({ ...atualizado, tags })
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    await execDel(() => clientesService.remover(confirmDel.id), {
      onSuccess: () => {
        toast.success('Cliente removido.')
        setConfirmDel(null)
        setSelecionado(null)
        refetch()
      },
      onError: msg => toast.error(msg),
    })
  }

  async function handleAtivarPortal(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await clientesService.ativarPortal(selecionado.id)
      toast.success('Portal ativado! E-mail enviado ao cliente com os dados de acesso.')
      setModalPortal(false)
      refetch()
      setSelecionado(prev => ({ ...prev, portal_ativo: true }))
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  // ── Novo processo com cliente pré-vinculado (atalho a partir da ficha) ──────
  async function handleCriarProcesso(form, tags = []) {
    setSaving(true)
    try {
      const novo = await processosService.criar({
        ...form,
        cliente_id: selecionado.id,
        honorarios: form.honorarios ? parseFloat(form.honorarios) : undefined,
      })
      for (const tag of tags) {
        await tagsService.atribuirProcesso(novo.id, tag.id)
      }
      toast.success('Processo criado e vinculado a ' + selecionado.nome + '!')
      setModalNovoProcesso(false)
      // Atualiza a lista de processos do cliente instantaneamente, sem refresh da página
      refetchProcessos()
      refetch() // atualiza contador "total_processos" na lista lateral também
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden">
      <DicaDaTela chave="clientes" titulo="Esta é a tela de Clientes">
        Cadastre aqui as pessoas e empresas que seu escritório atende. Depois de cadastrar, você pode
        vincular processos, registrar compromissos e ativar o portal — onde o cliente acompanha tudo sozinho.
      </DicaDaTela>
      <div className="flex gap-5 flex-1 overflow-hidden">

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col w-80 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-500">{clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setModalTags(true)} title="Gerenciar etiquetas"
              className="btn-secondary text-xs px-2.5 py-2">
              <TagIcon size={13} />
            </button>
            <button onClick={() => setModalCriar(true)} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2">
              <Plus size={13} /> Novo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 mb-3">
          <Search size={13} className="text-gray-400" />
          <input className="text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 bg-transparent"
            placeholder="Buscar cliente..." value={busca}
            onChange={e => setBusca(e.target.value)} />
          {busca && <button onClick={() => setBusca('')}><X size={12} className="text-gray-400" /></button>}
        </div>

        <div className="flex-1 overflow-y-auto card overflow-hidden">
          {clientes.length === 0
            ? <EmptyState icon={User} title="Nenhum cliente cadastrado"
                subtitle="Cadastre seu primeiro cliente (pessoa física ou jurídica) para começar a vincular processos, agenda e cobranças."
                action={<button onClick={() => setModalCriar(true)} className="btn-primary text-xs">+ Cadastrar primeiro cliente</button>} />
            : clientes.map(c => (
              <div key={c.id}
                onClick={() => setSelecionado(c)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors
                  ${selecionado?.id === c.id ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
              >
                <button onClick={(e) => toggleImportanteCliente(c, e)} className="p-0.5 flex-shrink-0" title={c.importante ? 'Remover destaque' : 'Marcar como importante'}>
                  <Star size={14} className={c.importante ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'} />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(c.id)}`}>
                  {avatarInitials(c.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.nome}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-400 truncate">{c.email || c.telefone || '—'}</p>
                    {c.tags?.length > 0 && (
                      <span className="flex items-center gap-0.5 flex-shrink-0">
                        {c.tags.slice(0, 3).map(t => (
                          <span key={t.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.cor }} title={t.nome} />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.portal_ativo ? 'bg-green-500' : 'bg-gray-200'}`} />
                  {c.total_processos > 0 && (
                    <span className="text-[10px] text-gray-400">{c.total_processos}p</span>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Detalhe ─────────────────────────────────────────────────────────── */}
      {selecionado ? (
        <div className="flex-1 overflow-y-auto space-y-4">

          {/* Header */}
          <div className="card p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-semibold flex-shrink-0 ${avatarColor(selecionado.id)}`}>
                {avatarInitials(selecionado.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-semibold text-gray-900">{selecionado.nome}</h2>
                  <span className="badge badge-gray text-[10px]">{selecionado.tipo}</span>
                  <span className={`badge text-[10px] ${selecionado.portal_ativo ? 'badge-green' : 'badge-gray'}`}>
                    {selecionado.portal_ativo ? 'Portal ativo' : 'Sem portal'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  {selecionado.email    && <span className="flex items-center gap-1"><Mail size={11}/>{selecionado.email}</span>}
                  {selecionado.telefone && <span className="flex items-center gap-1"><Phone size={11}/>{selecionado.telefone}</span>}
                  {selecionado.cpf_cnpj && <span className="font-mono">{selecionado.cpf_cnpj}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TagBadges tags={selecionado.tags} />
                  <TagPicker
                    todasTags={todasTags || []}
                    tagsAtuais={selecionado.tags || []}
                    onToggle={handleToggleTag}
                    onCriarNova={() => setModalTags(true)}
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setModalNovoProcesso(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  <Briefcase size={14} /> + Novo Processo
                </button>
                <button onClick={() => navigate(`/agenda?cliente_id=${selecionado.id}`)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Calendar size={12} /> Agendar
                </button>
                <button onClick={() => setModalEditar(selecionado)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Edit2 size={12} /> Editar
                </button>
                {!selecionado.portal_ativo
                  ? <button onClick={() => setModalPortal(true)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      <Lock size={12} /> Ativar portal
                    </button>
                  : <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-green-600">
                      <Unlock size={12} /> Portal ativo
                    </button>
                }
                <button onClick={() => setConfirmDel(selecionado)} className="btn-ghost text-red-400 hover:text-red-600 py-1.5 px-2">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Processos', selecionado.total_processos || 0],
                ['Tipo', selecionado.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'],
                ['Cadastro', formatDate(selecionado.criado_em)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl py-3 px-4">
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {selecionado.observacoes && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700 font-medium mb-0.5">Observações</p>
                <p className="text-xs text-amber-600">{selecionado.observacoes}</p>
              </div>
            )}
          </div>

          {/* Processos do cliente */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">Processos</p>
              <span className="badge badge-gray">{processos.length}</span>
            </div>
            {processos.length === 0
              ? <div className="py-8 text-center"><p className="text-sm text-gray-400">Nenhum processo vinculado</p></div>
              : processos.map(p => {
                  const statusClass = {
                    'Novo': 'bg-gray-100 text-gray-600',
                    'Em Andamento': 'bg-blue-50 text-blue-700',
                    'Aguardando': 'bg-amber-50 text-amber-700',
                    'Concluído': 'bg-green-50 text-green-700',
                  }[p.status] || 'bg-gray-100 text-gray-600'
                  return (
                    <div key={p.id}
                      onClick={() => navigate(`/processos/${p.id}`)}
                      className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer group transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-700 transition-colors">{p.titulo}</p>
                        {p.numero && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.numero}</p>}
                      </div>
                      <span className={`badge ${statusClass}`}>{p.status}</span>
                      {p.prazo && <span className="text-xs text-gray-400 hidden md:block">{formatDate(p.prazo)}</span>}
                      <ExternalLink size={13} className="text-gray-300 group-hover:text-brand-400 flex-shrink-0 transition-colors"/>
                    </div>
                  )
                })
            }
          </div>

          {/* Agenda do cliente */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">Agenda</p>
              <span className="badge badge-gray">{eventosAgenda.length}</span>
            </div>
            {eventosAgenda.length === 0
              ? <div className="py-8 text-center"><p className="text-sm text-gray-400">Nenhum compromisso agendado</p></div>
              : eventosAgenda.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-50">
                    <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar size={15} className="text-brand-700"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                        <span className="badge badge-gray text-[10px]">{ev.tipo}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={11}/> {formatDatetime(ev.data_hora)}</span>
                        {ev.local && <span className="flex items-center gap-1"><MapPin size={11}/> {ev.local}</span>}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <User size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Selecione um cliente para ver os detalhes</p>
            <button onClick={() => setModalCriar(true)} className="btn-primary text-xs mt-4">+ Cadastrar cliente</button>
          </div>
        </div>
      )}
      </div>{/* fim do flex de duas colunas */}

      {/* ── Modais ───────────────────────────────────────────────────────────── */}
      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Novo cliente" size="md">
        <ClienteForm onSave={handleCriar} onCancel={() => setModalCriar(false)} saving={saving}
          todasTags={todasTags || []} onCriarNovaTag={() => setModalTags(true)} />
      </Modal>

      <Modal open={!!modalEditar} onClose={() => setModalEditar(null)} title="Editar cliente" size="md">
        {modalEditar && (
          <ClienteForm
            inicial={modalEditar}
            onSave={handleEditar}
            onCancel={() => setModalEditar(null)}
            saving={saving}
            todasTags={todasTags || []}
            onCriarNovaTag={() => setModalTags(true)}
          />
        )}
      </Modal>

      <Modal open={modalPortal} onClose={() => setModalPortal(false)} title={`Ativar portal — ${selecionado?.nome}`} size="sm">
        <form onSubmit={handleAtivarPortal} className="space-y-4">
          {!selecionado?.email ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>Este cliente ainda não tem e-mail cadastrado.</strong> O portal envia a senha de acesso
              por e-mail, então é necessário cadastrar um e-mail antes de ativar. Feche esta janela, clique em
              <strong> Editar</strong> e adicione o e-mail do cliente.
            </div>
          ) : (
            <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-800">
              O sistema vai gerar uma senha de acesso automaticamente e enviar um e-mail de boas-vindas
              para <strong>{selecionado.email}</strong> com os dados de login, link de acesso ao portal,
              processos, documentos e cobranças.
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalPortal(false)} className="btn-secondary">
              {selecionado?.email ? 'Cancelar' : 'Fechar'}
            </button>
            {selecionado?.email && (
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Ativando...' : 'Confirmar Ativação'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      <Modal open={modalNovoProcesso} onClose={() => setModalNovoProcesso(false)} title="Novo processo" size="md">
        {selecionado && (
          <NovoProcessoForm
            clienteNome={selecionado.nome}
            onSave={handleCriarProcesso}
            onCancel={() => setModalNovoProcesso(false)}
            saving={saving}
            todasTags={todasTags || []}
            onCriarNovaTag={() => setModalTags(true)}
          />
        )}
      </Modal>

      <TagsManagerModal
        open={modalTags}
        onClose={() => setModalTags(false)}
        tags={todasTags}
        onChanged={() => { refetchTags(); refetch() }}
      />

      <ConfirmDialog
        open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Remover cliente"
        description={`Tem certeza que deseja remover "${confirmDel?.nome}"? Os processos vinculados não serão removidos.`}
        danger loading={deleting}
      />
    </div>
  )
}
