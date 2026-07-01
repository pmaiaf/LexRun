import { useState, useEffect } from 'react'
import { Plus, MapPin, Clock, ChevronLeft, ChevronRight, Trash2, User, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useApi, useAction } from '../hooks/useApi.js'
import { DicaDaTela } from '../components/Onboarding.jsx'
import { agendaService, clientesService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog, EmptyState } from '../components/ui/index.jsx'

const TIPO_COLOR = {
  Tarefa:    'bg-purple-50 text-purple-700 border-purple-100',
  Evento:    'bg-blue-50 text-blue-700 border-blue-100',
  Audiência: 'bg-red-50 text-red-700 border-red-100',
  Prazo:     'bg-amber-50 text-amber-700 border-amber-100',
  Reunião:   'bg-blue-50 text-blue-700 border-blue-100',
  Outros:    'bg-gray-50 text-gray-600 border-gray-100',
}
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function getMiniCal(year, month) {
  const first = new Date(year, month, 1).getDay()
  const days  = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  return cells
}

export default function AgendaPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [mes, setMes] = useState(new Date().getMonth())
  const [ano, setAno] = useState(new Date().getFullYear())
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [form, setForm] = useState({ titulo:'', data_hora:'', tipo:'Reunião', local:'', cliente_id:'' })
  const [saving, setSaving] = useState(false)
  const { execute: execDel, loading: deleting } = useAction()

  const { data: clientesData } = useApi(() => clientesService.listar({ limit: 200 }), [])
  const clientes = clientesData?.data || []

  // Se chegou via "Agendar" na ficha do cliente (/agenda?cliente_id=...&cliente_nome=...),
  // abre o modal já com o cliente pré-selecionado.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const clienteId = params.get('cliente_id')
    if (clienteId) {
      setForm(f => ({ ...f, cliente_id: clienteId }))
      setModalOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const { data, loading, error, refetch } = useApi(
    () => agendaService.listar({ mes: mes+1, ano }),
    [mes, ano]
  )
  const eventos = Array.isArray(data) ? data : []

  const cells = getMiniCal(ano, mes)
  const eventDays = eventos.map(e => new Date(e.data_hora).getDate())

  function abrirNovo() {
    setEditId(null)
    setForm({ titulo:'', data_hora:'', tipo:'Reunião', local:'', cliente_id:'' })
    setModalOpen(true)
  }

  function abrirEdicao(ev) {
    setEditId(ev.id)
    // datetime-local exige formato YYYY-MM-DDTHH:mm
    const dt = new Date(ev.data_hora)
    const pad = n => String(n).padStart(2, '0')
    const local = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
    setForm({
      titulo: ev.titulo || '',
      data_hora: local,
      tipo: ev.tipo || 'Reunião',
      local: ev.local || '',
      cliente_id: ev.cliente_id || '',
    })
    setModalOpen(true)
  }

  function fecharModal() {
    setModalOpen(false)
    setEditId(null)
    setForm({ titulo:'', data_hora:'', tipo:'Reunião', local:'', cliente_id:'' })
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) {
        await agendaService.atualizar(editId, { ...form, cliente_id: form.cliente_id || null })
        toast.success('Evento atualizado!')
      } else {
        await agendaService.criar({ ...form, cliente_id: form.cliente_id || undefined, responsavel_id: user?.id, status: 'a_fazer' })
        toast.success('Evento criado!')
      }
      fecharModal(); refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    await execDel(() => agendaService.remover(confirmDel.id), {
      onSuccess: () => { toast.success('Evento removido.'); setConfirmDel(null); refetch() },
      onError: msg => toast.error(msg),
    })
  }

  function prevMes() { if (mes===0) { setMes(11); setAno(a=>a-1) } else setMes(m=>m-1) }
  function nextMes() { if (mes===11){ setMes(0);  setAno(a=>a+1) } else setMes(m=>m+1) }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 md:p-8">
      <DicaDaTela chave="agenda" titulo="Esta é a sua Agenda">
        Registre audiências, prazos e reuniões. Vincule um evento a um cliente e marque "avisar o cliente
        por e-mail" para que ele seja notificado automaticamente sobre o compromisso.
      </DicaDaTela>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500">{MESES[mes]} {ano}</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-1.5"><Plus size={14}/>Novo evento</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Mini calendário */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMes} className="btn-ghost p-1"><ChevronLeft size={14}/></button>
            <p className="text-sm font-medium text-gray-800">{MESES[mes]} {ano}</p>
            <button onClick={nextMes} className="btn-ghost p-1"><ChevronRight size={14}/></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DIAS_SEMANA.map(d=><div key={d} className="text-[10px] text-gray-400 font-medium py-1">{d}</div>)}
            {cells.map((d,i)=>(
              <div key={i} className={`text-xs py-1.5 rounded-md ${
                d===null ? '' :
                eventDays.includes(d) ? 'bg-brand-100 text-brand-800 font-medium cursor-pointer' :
                d===new Date().getDate()&&mes===new Date().getMonth()&&ano===new Date().getFullYear() ? 'bg-brand-800 text-white font-medium' :
                'text-gray-700 hover:bg-gray-100 cursor-pointer'
              }`}>{d||''}</div>
            ))}
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm font-medium text-gray-700">{eventos.length} evento{eventos.length!==1?'s':''} em {MESES[mes]}</p>
          {eventos.length === 0
            ? <EmptyState icon={Clock} title="Nenhum evento neste mês" action={<button onClick={abrirNovo} className="btn-primary text-xs">+ Novo evento</button>} />
            : eventos.map(ev=>{
              const dt = new Date(ev.data_hora)
              const colorClass = TIPO_COLOR[ev.tipo] || TIPO_COLOR.Outros
              return (
                <div key={ev.id} className={`card p-4 border ${colorClass}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-[10px] border ${colorClass}`}>{ev.tipo}</span>
                        {ev.processo_titulo && <span className="text-[10px] text-gray-400 truncate">{ev.processo_titulo}</span>}
                        {ev.cliente_nome && (
                          <span className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                            <User size={9}/>{ev.cliente_nome}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800">{ev.titulo}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={11}/>{dt.toLocaleDateString('pt-BR')} · {dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                        {ev.local && <span className="flex items-center gap-1"><MapPin size={11}/>{ev.local}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <button onClick={()=>abrirEdicao(ev)} className="text-gray-300 hover:text-brand-500"><Pencil size={13}/></button>
                      <button onClick={()=>setConfirmDel(ev)} className="text-gray-300 hover:text-red-400"><Trash2 size={13}/></button>
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      <Modal open={modalOpen} onClose={fecharModal} title={editId ? 'Editar evento' : 'Novo evento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Título" required><input className="input" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} required /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data e hora" required><input type="datetime-local" className="input" value={form.data_hora} onChange={e=>setForm(f=>({...f,data_hora:e.target.value}))} required /></FormField>
            <FormField label="Tipo"><select className="input" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>{['Tarefa','Evento','Audiência','Prazo','Reunião','Outros'].map(t=><option key={t}>{t}</option>)}</select></FormField>
          </div>
          <FormField label="Local"><input className="input" value={form.local} onChange={e=>setForm(f=>({...f,local:e.target.value}))} placeholder="Ex: 1ª Vara Cível, Videoconferência..." /></FormField>
          <FormField label="Vincular a um cliente (opcional)">
            <select className="input" value={form.cliente_id} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value}))}>
              <option value="">Nenhum cliente específico</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>
          {form.cliente_id && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={!!form.avisar_cliente}
                onChange={e=>setForm(f=>({...f, avisar_cliente: e.target.checked}))}
                className="rounded"/>
              Avisar o cliente por e-mail sobre este compromisso
            </label>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={fecharModal} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving?'Salvando...':(editId?'Salvar alterações':'Criar evento')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={handleDelete}
        title="Remover evento" description={`Remover "${confirmDel?.titulo}"?`} danger loading={deleting} />
    </div>
  )
}
