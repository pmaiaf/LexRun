import { useState, useEffect, useMemo } from 'react'
import { Plus, MapPin, Clock, ChevronLeft, ChevronRight, Trash2, User, Pencil, CalendarDays, List } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useApi, useAction } from '../hooks/useApi.js'
import { DicaDaTela } from '../components/Onboarding.jsx'
import { agendaService, clientesService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog, EmptyState } from '../components/ui/index.jsx'

// Cor por tipo (chip no calendário). Barra à esquerda + fundo suave.
const TIPO_COLOR = {
  Tarefa:    { chip: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', bar: 'border-l-purple-500' },
  Evento:    { chip: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500',   bar: 'border-l-blue-500' },
  Audiência: { chip: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500',    bar: 'border-l-red-500' },
  Prazo:     { chip: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500',  bar: 'border-l-amber-500' },
  Reunião:   { chip: 'bg-teal-50 text-teal-700 border-teal-200',       dot: 'bg-teal-500',   bar: 'border-l-teal-500' },
  Outros:    { chip: 'bg-gray-50 text-gray-600 border-gray-200',       dot: 'bg-gray-400',   bar: 'border-l-gray-400' },
}
const cor = t => TIPO_COLOR[t] || TIPO_COLOR.Outros
const TIPOS = ['Tarefa', 'Evento', 'Audiência', 'Prazo', 'Reunião', 'Outros']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_ABREV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const HORA_INI = 6, HORA_FIM = 24, ALTURA_HORA = 56 // grade de 6h às 23h; px por hora nas visões dia/semana

// ── helpers de data ──────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0')
const addDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const inicioSemana = d => { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate() - x.getDay()); return x }
const mesmoDia = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
const ehHoje = d => mesmoDia(d, new Date())
const paraInput = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const fmtHora = d => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export default function AgendaPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [view, setView]     = useState('mes')            // mes | semana | dia | lista
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId]       = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [form, setForm] = useState({ titulo:'', data_hora:'', tipo:'Evento', local:'', cliente_id:'' })
  const [saving, setSaving] = useState(false)
  const { execute: execDel, loading: deleting } = useAction()

  const { data: clientesData } = useApi(() => clientesService.listar({ limit: 200 }), [])
  const clientes = clientesData?.data || []

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const clienteId = params.get('cliente_id')
    if (clienteId) {
      setForm(f => ({ ...f, cliente_id: clienteId })); setModalOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // meses que a visão atual cobre (semana pode cruzar 2 meses)
  function mesesNecessarios() {
    if (view === 'semana') {
      const ini = inicioSemana(cursor), fim = addDias(ini, 6)
      const m = new Map()
      ;[ini, fim].forEach(d => m.set(`${d.getFullYear()}-${d.getMonth()}`, { mes: d.getMonth(), ano: d.getFullYear() }))
      return [...m.values()]
    }
    return [{ mes: cursor.getMonth(), ano: cursor.getFullYear() }]
  }
  const fetchKey = view === 'semana' ? inicioSemana(cursor).getTime() : `${cursor.getFullYear()}-${cursor.getMonth()}`

  const { data, loading, error, refetch } = useApi(() => {
    const meses = mesesNecessarios()
    return Promise.all(meses.map(({ mes, ano }) => agendaService.listar({ mes: mes+1, ano })))
      .then(arrs => {
        const vistos = new Set(); const out = []
        arrs.flat().forEach(e => { if (e && !vistos.has(e.id)) { vistos.add(e.id); out.push(e) } })
        return out
      })
  }, [view, fetchKey])

  const eventos = useMemo(() => (Array.isArray(data) ? data : [])
    .map(e => ({ ...e, _dt: new Date(e.data_hora) }))
    .sort((a, b) => a._dt - b._dt), [data])

  const eventosDoDia = d => eventos.filter(e => mesmoDia(e._dt, d))

  // ── CRUD ──
  function abrirNovo(dataBase) {
    setEditId(null)
    const base = dataBase || (() => { const d = new Date(); d.setHours(9,0,0,0); return d })()
    setForm({ titulo:'', data_hora: paraInput(base), tipo:'Evento', local:'', cliente_id:'' })
    setModalOpen(true)
  }
  function abrirEdicao(ev) {
    setEditId(ev.id)
    setForm({ titulo: ev.titulo||'', data_hora: paraInput(new Date(ev.data_hora)), tipo: ev.tipo||'Evento', local: ev.local||'', cliente_id: ev.cliente_id||'' })
    setModalOpen(true)
  }
  function fecharModal() { setModalOpen(false); setEditId(null) }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await agendaService.atualizar(editId, { ...form, cliente_id: form.cliente_id || null }); toast.success('Evento atualizado!') }
      else        { await agendaService.criar({ ...form, cliente_id: form.cliente_id || undefined, responsavel_id: user?.id }); toast.success('Evento criado!') }
      fecharModal(); refetch()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }
  async function handleDelete() {
    await execDel(() => agendaService.remover(confirmDel.id), {
      onSuccess: () => { toast.success('Evento removido.'); setConfirmDel(null); refetch() },
      onError: msg => toast.error(msg),
    })
  }

  // ── navegação ──
  function navegar(dir) {
    setCursor(c => {
      const d = new Date(c)
      if (view === 'mes' || view === 'lista') d.setMonth(d.getMonth() + dir)
      else if (view === 'semana') d.setDate(d.getDate() + 7 * dir)
      else d.setDate(d.getDate() + dir)
      return d
    })
  }
  const hoje = () => setCursor(() => { const d = new Date(); d.setHours(0,0,0,0); return d })

  const rotuloPeriodo = () => {
    if (view === 'dia') return cursor.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })
    if (view === 'semana') {
      const ini = inicioSemana(cursor), fim = addDias(ini, 6)
      return `${ini.getDate()} ${MESES_ABREV[ini.getMonth()]} – ${fim.getDate()} ${MESES_ABREV[fim.getMonth()]} ${fim.getFullYear()}`
    }
    return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 md:p-8">
      <DicaDaTela chave="agenda" titulo="Esta é a sua Agenda">
        Alterne entre Mês, Semana, Dia e Lista. Clique num espaço livre para criar um compromisso naquele horário,
        ou num evento para editá-lo. Vincule a um cliente para avisá-lo por e-mail.
      </DicaDaTela>

      {/* Cabeçalho + controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 capitalize">{rotuloPeriodo()}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* seletor de visão */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
            {[['mes','Mês'],['semana','Semana'],['dia','Dia'],['lista','Lista']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${view===v ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navegar(-1)} className="btn-ghost p-1.5"><ChevronLeft size={16}/></button>
            <button onClick={hoje} className="btn-secondary text-xs px-3 py-1.5">Hoje</button>
            <button onClick={() => navegar(1)} className="btn-ghost p-1.5"><ChevronRight size={16}/></button>
          </div>
          <button onClick={() => abrirNovo()} className="btn-primary flex items-center gap-1.5"><Plus size={14}/>Novo evento</button>
        </div>
      </div>

      {view === 'mes'    && <VisaoMes    cursor={cursor} eventos={eventos} eventosDoDia={eventosDoDia} onDia={abrirNovo} onEvento={abrirEdicao} />}
      {view === 'semana' && <VisaoTempo  dias={7} cursor={cursor} eventosDoDia={eventosDoDia} onSlot={abrirNovo} onEvento={abrirEdicao} />}
      {view === 'dia'    && <VisaoTempo  dias={1} cursor={cursor} eventosDoDia={eventosDoDia} onSlot={abrirNovo} onEvento={abrirEdicao} />}
      {view === 'lista'  && <VisaoLista  eventos={eventos} onEvento={abrirEdicao} onDel={setConfirmDel} onNovo={() => abrirNovo()} />}

      {/* Modal criar/editar */}
      <Modal open={modalOpen} onClose={fecharModal} title={editId ? 'Editar evento' : 'Novo evento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Título" required><input className="input" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} required autoFocus /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data e hora" required><input type="datetime-local" className="input" value={form.data_hora} onChange={e=>setForm(f=>({...f,data_hora:e.target.value}))} required /></FormField>
            <FormField label="Tipo"><select className="input" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></FormField>
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
              <input type="checkbox" checked={!!form.avisar_cliente} onChange={e=>setForm(f=>({...f, avisar_cliente: e.target.checked}))} className="rounded"/>
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

// ── Visão Mês ────────────────────────────────────────────────────────────────
function VisaoMes({ cursor, eventosDoDia, onDia, onEvento }) {
  const ano = cursor.getFullYear(), mes = cursor.getMonth()
  const primeiro = new Date(ano, mes, 1)
  const inicioGrade = addDias(primeiro, -primeiro.getDay())
  const semanas = []
  for (let s = 0; s < 6; s++) semanas.push(Array.from({ length: 7 }, (_, d) => addDias(inicioGrade, s*7 + d)))
  // não mostra a 6ª semana se ela for toda do mês seguinte
  const semanasVis = semanas.filter(sem => sem.some(d => d.getMonth() === mes) || sem === semanas[0])

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DIAS_SEMANA.map(d => <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {semanasVis.flat().map((d, i) => {
          const doMes = d.getMonth() === mes
          const evs = eventosDoDia(d)
          return (
            <div key={i} onClick={() => onDia(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0))}
              className={`min-h-[104px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors hover:bg-gray-50/70 ${doMes ? '' : 'bg-gray-50/40'}`}>
              <div className="flex justify-end mb-1">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                  ehHoje(d) ? 'bg-brand-800 text-white font-semibold' : doMes ? 'text-gray-700' : 'text-gray-300'}`}>{d.getDate()}</span>
              </div>
              <div className="space-y-1">
                {evs.slice(0, 3).map(ev => (
                  <button key={ev.id} onClick={e => { e.stopPropagation(); onEvento(ev) }}
                    className={`w-full text-left text-[11px] leading-tight px-1.5 py-0.5 rounded-md border-l-2 ${cor(ev.tipo).chip} ${cor(ev.tipo).bar} truncate`}>
                    <span className="font-medium">{fmtHora(ev._dt)}</span> {ev.titulo}
                  </button>
                ))}
                {evs.length > 3 && <p className="text-[10px] text-gray-400 pl-1">+{evs.length - 3} mais</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Visão Dia / Semana (grade de horas) ──────────────────────────────────────
function VisaoTempo({ dias, cursor, eventosDoDia, onSlot, onEvento }) {
  const base = dias === 7 ? inicioSemana(cursor) : new Date(cursor)
  const colunas = Array.from({ length: dias }, (_, i) => addDias(base, i))
  const horas = Array.from({ length: HORA_FIM - HORA_INI }, (_, i) => HORA_INI + i)

  return (
    <div className="card overflow-hidden">
      {/* cabeçalho de dias */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `56px repeat(${dias}, 1fr)` }}>
        <div />
        {colunas.map((d, i) => (
          <div key={i} className="py-2 text-center border-l border-gray-100">
            <p className="text-[11px] text-gray-400 uppercase">{DIAS_SEMANA[d.getDay()]}</p>
            <p className={`text-sm mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${ehHoje(d) ? 'bg-brand-800 text-white font-semibold' : 'text-gray-700'}`}>{d.getDate()}</p>
          </div>
        ))}
      </div>
      {/* grade */}
      <div className="grid overflow-y-auto" style={{ gridTemplateColumns: `56px repeat(${dias}, 1fr)`, maxHeight: '62vh' }}>
        {/* gutter de horas */}
        <div>
          {horas.map(h => <div key={h} className="text-[10px] text-gray-400 text-right pr-2 -mt-1.5" style={{ height: ALTURA_HORA }}>{pad(h)}:00</div>)}
        </div>
        {/* colunas de dias */}
        {colunas.map((d, ci) => {
          const evs = eventosDoDia(d)
          return (
            <div key={ci} className="relative border-l border-gray-100">
              {horas.map(h => (
                <div key={h} onClick={() => onSlot(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0))}
                  className="border-b border-gray-50 hover:bg-brand-50/40 cursor-pointer" style={{ height: ALTURA_HORA }} />
              ))}
              {evs.map(ev => {
                const h = ev._dt.getHours() + ev._dt.getMinutes()/60
                const top = Math.max(0, (h - HORA_INI) * ALTURA_HORA)
                return (
                  <button key={ev.id} onClick={() => onEvento(ev)}
                    className={`absolute left-1 right-1 text-left rounded-md border-l-2 px-1.5 py-1 overflow-hidden ${cor(ev.tipo).chip} ${cor(ev.tipo).bar}`}
                    style={{ top, minHeight: ALTURA_HORA - 6 }}>
                    <p className="text-[11px] font-semibold leading-tight truncate">{ev.titulo}</p>
                    <p className="text-[10px] opacity-80">{fmtHora(ev._dt)}{ev.local ? ` · ${ev.local}` : ''}</p>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Visão Lista ──────────────────────────────────────────────────────────────
function VisaoLista({ eventos, onEvento, onDel, onNovo }) {
  if (!eventos.length) return <EmptyState icon={Clock} title="Nenhum evento neste período" action={<button onClick={onNovo} className="btn-primary text-xs">+ Novo evento</button>} />
  // agrupa por dia
  const grupos = {}
  eventos.forEach(ev => { const k = ev._dt.toDateString(); (grupos[k] = grupos[k] || []).push(ev) })
  return (
    <div className="space-y-5">
      {Object.entries(grupos).map(([k, evs]) => {
        const d = new Date(k)
        return (
          <div key={k}>
            <p className={`text-sm font-semibold mb-2 capitalize ${ehHoje(d) ? 'text-brand-700' : 'text-gray-700'}`}>
              {d.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}{ehHoje(d) && ' · hoje'}
            </p>
            <div className="space-y-2">
              {evs.map(ev => (
                <div key={ev.id} className={`card p-3.5 flex items-start justify-between border-l-4 ${cor(ev.tipo).bar}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-[10px] border ${cor(ev.tipo).chip}`}>{ev.tipo}</span>
                      {ev.cliente_nome && <span className="text-[10px] text-gray-400 truncate flex items-center gap-0.5"><User size={9}/>{ev.cliente_nome}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{ev.titulo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={11}/>{fmtHora(ev._dt)}</span>
                      {ev.local && <span className="flex items-center gap-1"><MapPin size={11}/>{ev.local}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={() => onEvento(ev)} className="text-gray-300 hover:text-brand-500"><Pencil size={13}/></button>
                    <button onClick={() => onDel(ev)} className="text-gray-300 hover:text-red-400"><Trash2 size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
