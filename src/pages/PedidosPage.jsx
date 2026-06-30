import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sparkles, Plus, Zap, Clock, Download, Trash2, Coins, ShoppingCart,
  FileText, Loader2, CheckCircle2, AlertTriangle, X, Eye, Gift,
  ChevronLeft, ChevronRight, Paperclip, Image as ImageIcon, File as FileIcon,
} from 'lucide-react'
import { pedidosService } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useApi, useAction } from '../hooks/useApi.js'
import {
  LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog, EmptyState,
} from '../components/ui/index.jsx'
import { formatDate } from '../utils/helpers.js'

const TIPOS = [
  { value: 'peticao',   label: 'Petição' },
  { value: 'parecer',   label: 'Parecer' },
  { value: 'contrato',  label: 'Contrato' },
  { value: 'indicacao', label: 'Indicação de Petição' },
]
const TIPO_LABEL = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

const AREAS = ['Trabalhista', 'Previdenciário', 'Criminal', 'Asdministrativo', 'Cível', 'Tributário', 'Ambiental', 'Eleitoral']
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const SUBAREAS = {
  'Cível': ['Consumidor', 'Obrigações', 'Contratuais', 'Sucessões', 'Empresarial', 'Possessórias', 'Imobiliário', 'Responsabilidade Civil', 'Família'],
}

const COMPETENCIAS = ['Justiça Estadual', 'Justiça Federal', 'Justiça do Trabalho', 'Juizado Especial Cível', 'Juizado Especial Federal', 'Justiça Eleitoral']
const TIPOS_PETICAO = ['Inicial', 'Contestação', 'Manifestação', 'Recursos', 'Contrarrazões']
const PETICAO_PUBLICACAO = ['Manifestação', 'Recursos', 'Contrarrazões']
const PETICAO_GRATUITA_2N = ['Recursos', 'Contrarrazões']

// Tipos de parte por serviço (Parecer usa Parte 01/02 fixas).
const PARTES = {
  peticao:   { modo: 'dinamica', tipos: ['Autor', 'Réu', 'Terceiro Interessado', 'Outro'] },
  contrato:  { modo: 'dinamica', tipos: ['Contratante', 'Contratada', 'Interveniente', 'Outro'] },
  indicacao: { modo: 'dinamica', tipos: ['Autor', 'Réu', 'Outro'] },
  parecer:   { modo: 'fixa2' },
}

const SIM_NAO = ['Sim', 'Não']

// ── Campos do passo "Serviço" (dados do processo, condicionais) ────────────────
function camposServico(tipo, campos) {
  if (tipo === 'peticao') {
    const tp = campos.tipo_peticao
    const f = [
      { key: 'tipo_peticao', label: 'Tipo de petição', type: 'select', required: true, options: TIPOS_PETICAO },
      { key: 'numero_processo', label: 'Já existe processo? Informe o número', type: 'text', placeholder: '0000000-00.0000.0.00.0000' },
    ]
    if (tp === 'Inicial') {
      f.push(
        { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
        { key: 'comarca_uf', label: 'Comarca — UF', type: 'select', options: UFS },
        { key: 'comarca_cidade', label: 'Comarca — Cidade', type: 'text' },
        { key: 'justica_gratuita', label: 'Requerer justiça gratuita?', type: 'radio', options: SIM_NAO },
        { key: 'tipo_acao', label: 'Qual o tipo de ação que deseja?', type: 'text' },
        { key: 'pedido_cumulado', label: 'Tem pedido cumulado?', type: 'radio', options: SIM_NAO },
      )
    } else if (tp === 'Contestação') {
      f.push({ key: 'houve_citacao', label: 'Houve citação do réu?', type: 'radio', options: SIM_NAO })
    } else if (PETICAO_PUBLICACAO.includes(tp)) {
      f.push({ key: 'data_publicacao', label: 'Qual data ocorreu a publicação?', type: 'date' })
      if (PETICAO_GRATUITA_2N.includes(tp)) {
        f.push({ key: 'justica_gratuita', label: 'Requerer justiça gratuita?', type: 'radio', options: SIM_NAO })
      }
    }
    return f
  }
  if (tipo === 'contrato') {
    return [{ key: 'tipo_contrato', label: 'Tipo de contrato', type: 'select',
      options: ['Prestação de Serviços', 'Compra e Venda', 'Locação', 'Confidencialidade (NDA)', 'Sociedade', 'Honorários Advocatícios', 'Distrato', 'Outro'] }]
  }
  // parecer / indicacao
  return [{ key: 'numero_processo', label: 'Número do processo (se houver)', type: 'text', placeholder: 'Se aplicável' }]
}

// ── Campos do passo "Caso" (por serviço) ───────────────────────────────────────
function camposCaso(tipo) {
  if (tipo === 'peticao') {
    return [
      { bind: 'descricao', label: 'Nos conte sobre o caso e qual é a versão do réu', type: 'textarea', required: true,
        placeholder: 'Uma visão geral do processo e um resumo dos acontecimentos.' },
      { key: 'preliminares', label: 'Tem preliminares a serem arguidas?', type: 'radio', options: ['Preciso de preliminares', 'Não preciso de preliminares'] },
      { key: 'prejudiciais', label: 'Tem prejudiciais de mérito a serem arguidas?', type: 'radio', options: SIM_NAO },
      { key: 'topicos', label: 'Quais tópicos são imprescindíveis na sua petição?', type: 'textarea',
        placeholder: 'Informe somente o tópico — a argumentação e fundamentação é por nossa conta.' },
      { key: 'tutela_urgencia', label: 'Será necessário requerer tutela de urgência?', type: 'radio', options: SIM_NAO },
      { key: 'reconvencao', label: 'Deseja pedido de reconvenção ou contraposto?', type: 'radio', options: SIM_NAO },
      { bind: 'advogado_subscritor', label: 'Advogado subscritor', type: 'text', placeholder: 'Nome e OAB' },
    ]
  }
  if (tipo === 'parecer') {
    return [
      { bind: 'descricao', label: 'Situação que deseja o estudo e seus objetivos', type: 'textarea', required: true,
        placeholder: 'Descreva a situação para elaboração do parecer.' },
      { bind: 'duvidas', label: 'Quais dúvidas gostaria que fossem esclarecidas?', type: 'textarea',
        placeholder: 'Aponte as dúvidas sobre o caso para sermos assertivos.' },
      { bind: 'advogado_subscritor', label: 'Advogado subscritor', type: 'text', placeholder: 'Nome e OAB' },
    ]
  }
  if (tipo === 'contrato') {
    return [
      { key: 'contrato_desejado', label: 'Informe o contrato que deseja a elaboração', type: 'text' },
      { bind: 'descricao', label: 'Objeto do contrato', type: 'textarea', required: true,
        placeholder: 'Descreva o que as partes estão contratando.' },
      { key: 'remuneracao', label: 'Forma e condições de remuneração', type: 'textarea',
        placeholder: 'Valor, forma de pagamento e dados bancários.' },
      { key: 'prazo_contrato', label: 'Prazo de duração do contrato', type: 'text' },
      { key: 'clausula_resolutiva', label: 'Cláusula resolutiva', type: 'textarea',
        placeholder: 'Multas e/ou indenizações pela parte que descumprir.' },
      { key: 'confidencialidade', label: 'Acordo de confidencialidade?', type: 'radio', options: SIM_NAO },
      { key: 'direitos_deveres', label: 'Direitos e deveres das partes', type: 'textarea' },
      { key: 'condicoes_gerais', label: 'Condições gerais', type: 'textarea' },
      { key: 'extincao_rescisao', label: 'Formas de extinção e rescisão', type: 'textarea' },
      { key: 'solucao_conflito', label: 'Formas de solução de conflito', type: 'text',
        placeholder: 'Judicial ou extrajudicial (se extrajudicial, qual via).' },
      { key: 'foro', label: 'Foro', type: 'text' },
      { bind: 'advogado_subscritor', label: 'Advogado subscritor', type: 'text', placeholder: 'Nome e OAB' },
    ]
  }
  // indicacao
  return [
    { bind: 'descricao', label: 'Nos conte um pouco sobre o caso', type: 'textarea', required: true,
      placeholder: 'Uma breve visão do processo. Aqui identificamos a petição cabível ao caso.' },
    { bind: 'advogado_subscritor', label: 'Advogado subscritor', type: 'text', placeholder: 'Nome e OAB' },
    { key: 'timbrado', label: 'Deverá usar o timbrado do cliente?', type: 'radio', options: SIM_NAO },
  ]
}

const ABAS = [
  { key: 'rascunho',  label: 'Rascunho' },
  { key: 'andamento', label: 'Em Andamento' },
  { key: 'concluido', label: 'Concluído' },
]
const TIERS = {
  padrao:  { label: 'Padrão',  creditos: 1, promessa: 'Liberado em até 24 horas' },
  express: { label: 'Express', creditos: 2, promessa: 'Liberado em até 20 minutos' },
}
const MAX_ANEXOS = 20

function formatCountdown(seg) {
  if (seg <= 0) return 'liberando…'
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60
  if (h > 0) return `${h}h ${m}min`
  if (m > 0) return `${m}min ${String(s).padStart(2, '0')}s`
  return `${s}s`
}
function abaDoPedido(p) {
  if (p.status === 'rascunho') return 'rascunho'
  if (p.disponivel) return 'concluido'
  return 'andamento'
}

export default function PedidosPage() {
  const { user } = useAuth()
  const toast = useToast()
  const ehSocio = user?.cargo === 'socio'

  const [aba, setAba] = useState('andamento')
  const [refreshKey, setRefreshKey] = useState(0)
  const refetchAll = () => setRefreshKey(k => k + 1)

  const saldoApi = useApi(() => pedidosService.saldo(), [refreshKey])
  const listApi  = useApi(() => pedidosService.listar(), [refreshKey])

  const [novaAberta, setNovaAberta] = useState(false)
  const [editando, setEditando]     = useState(null)
  const [compraAberta, setCompraAberta] = useState(false)
  const [verPedido, setVerPedido]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const { execute: execDel } = useAction()

  const fetchedAtRef = useRef(Date.now())
  const lastPollRef  = useRef(0)
  const [, tick]     = useState(0)
  useEffect(() => { fetchedAtRef.current = Date.now() }, [listApi.data])
  useEffect(() => { const id = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(id) }, [])
  const restante = (p) => Math.max(0, (p.segundos_para_liberar || 0) - Math.floor((Date.now() - fetchedAtRef.current) / 1000))

  const temPendente = (listApi.data?.pedidos || []).some(p => ['processando', 'aguardando_liberacao'].includes(p.status))
  useEffect(() => {
    if (!temPendente) return
    const id = setInterval(() => { const now = Date.now(); if (now - lastPollRef.current > 4000) { lastPollRef.current = now; refetchAll() } }, 5000)
    return () => clearInterval(id)
  }, [temPendente])

  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const compra = searchParams.get('compra')
    if (!compra) return
    if (compra === 'sucesso') { toast.success('Pagamento recebido! Seus créditos já estão disponíveis.'); refetchAll() }
    if (compra === 'pendente') toast.info('Pagamento pendente — os créditos entram assim que for confirmado.')
    if (compra === 'cancelado') toast.info('Compra cancelada.')
    searchParams.delete('compra'); setSearchParams(searchParams, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (listApi.loading && !listApi.data) return <LoadingScreen />
  if (listApi.error && !listApi.data) return <ErrorBlock message={listApi.error} onRetry={refetchAll} error={listApi.errorObj} />

  const saldo     = saldoApi.data?.saldo ?? 0
  const packs     = saldoApi.data?.packs ?? []
  const modoTeste = saldoApi.data?.modo_teste
  const contagens = listApi.data?.contagens ?? { rascunho: 0, andamento: 0, concluido: 0 }
  const pedidos   = (listApi.data?.pedidos || []).filter(p => abaDoPedido(p) === aba)

  const concederTeste = () => execDel(() => pedidosService.concederTeste(10), {
    onSuccess: () => { toast.success('+10 créditos de teste.'); refetchAll() }, onError: (m) => toast.error(m),
  })
  const abrirNova = () => { setEditando(null); setNovaAberta(true) }
  const continuarRascunho = (p) => { setEditando(p); setNovaAberta(true) }
  const excluir = (p) => execDel(() => pedidosService.remover(p.id), {
    onSuccess: () => { toast.success('Rascunho excluído.'); setConfirmDel(null); refetchAll() },
    onError: (m) => { toast.error(m); setConfirmDel(null) },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={20} className="text-brand-700" /> Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Solicite petições, pareceres e contratos.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-brand-50 text-brand-800 rounded-lg px-3 py-2 text-sm font-medium">
            <Coins size={15} /> {saldo} crédito{saldo === 1 ? '' : 's'}
          </div>
          {modoTeste && ehSocio && (
            <button onClick={concederTeste} className="btn-secondary !py-2 flex items-center gap-1.5" title="Modo de teste"><Gift size={15} /> Teste</button>
          )}
          {ehSocio && (
            <button onClick={() => setCompraAberta(true)} className="btn-secondary !py-2 flex items-center gap-1.5"><ShoppingCart size={15} /> Comprar</button>
          )}
          <button onClick={abrirNova} className="btn-primary !py-2 flex items-center gap-1.5"><Plus size={16} /> Nova Solicitação</button>
        </div>
      </div>

      {modoTeste && (
        <div className="mb-4 text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle size={14} /> Modo de teste ativo — prazos reduzidos e créditos de teste liberados. Desative em produção.
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-gray-100 mb-4">
        {ABAS.map(({ key, label }) => (
          <button key={key} onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${aba === key ? 'border-brand-700 text-brand-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label} <span className="text-gray-400">{contagens[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <EmptyState icon={FileText} title="Nada por aqui ainda"
          subtitle={aba === 'rascunho' ? 'Rascunhos não confirmados aparecem aqui.' : aba === 'andamento' ? 'Solicitações em andamento ou aguardando liberação.' : 'Documentos prontos para download.'}
          action={aba !== 'concluido' ? <button onClick={abrirNova} className="btn-primary">Nova Solicitação</button> : null} />
      ) : (
        <div className="space-y-2.5">
          {pedidos.map(p => (
            <PedidoCard key={p.id} p={p} restante={restante(p)}
              onVer={() => setVerPedido(p)} onContinuar={() => continuarRascunho(p)} onExcluir={() => setConfirmDel(p)} />
          ))}
        </div>
      )}

      {novaAberta && (
        <NovaSolicitacao open={novaAberta} onClose={() => setNovaAberta(false)}
          rascunho={editando} saldo={saldo} ehSocio={ehSocio} defaultAdvogado={user?.nome || ''}
          onComprar={() => { setNovaAberta(false); setCompraAberta(true) }}
          onConcluido={() => { setNovaAberta(false); setAba('andamento'); refetchAll() }}
          onRascunhoSalvo={() => { setNovaAberta(false); setAba('rascunho'); refetchAll() }} />
      )}
      {compraAberta && <CompraCreditos open={compraAberta} onClose={() => setCompraAberta(false)} packs={packs} />}
      {verPedido && <VerPedido pedido={verPedido} onClose={() => setVerPedido(null)} />}
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => excluir(confirmDel)} danger
        title="Excluir rascunho?" description="Esta ação não pode ser desfeita." />
    </div>
  )
}

function PedidoCard({ p, restante, onVer, onContinuar, onExcluir }) {
  const tier = TIERS[p.tier] || TIERS.padrao
  let badge
  if (p.status === 'rascunho') badge = <span className="badge-gray">Rascunho</span>
  else if (p.status === 'processando') badge = <span className="badge-blue flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Em andamento…</span>
  else if (p.status === 'erro') badge = <span className="badge-red flex items-center gap-1"><AlertTriangle size={11} /> Falhou — crédito estornado</span>
  else if (p.disponivel) badge = <span className="badge-green flex items-center gap-1"><CheckCircle2 size={11} /> Concluído</span>
  else badge = <span className="badge-amber flex items-center gap-1"><Clock size={11} /> Disponível em {formatCountdown(restante)}</span>

  return (
    <div className="card p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-[15px]">{TIPO_LABEL[p.tipo_servico] || p.tipo_servico}</span>
          {p.area && <span className="text-sm text-gray-400">· {p.area}{p.sub_area ? ` / ${p.sub_area}` : ''}</span>}
          <span className={`badge ${p.tier === 'express' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'} flex items-center gap-1`}>
            {p.tier === 'express' && <Zap size={10} />}{tier.label}
          </span>
          {Array.isArray(p.anexos) && p.anexos.length > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5"><Paperclip size={11} /> {p.anexos.length}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <span>{formatDate(p.criado_em)}</span>
          {p.campos?.numero_processo && <span>· Proc. {p.campos.numero_processo}</span>}
          {Array.isArray(p.partes) && p.partes[0]?.nome && <span>· {p.partes[0].nome}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge}
        {p.status === 'rascunho' && (
          <>
            <button onClick={onContinuar} className="btn-secondary !py-1.5 !px-3 text-sm">Continuar</button>
            <button onClick={onExcluir} className="text-gray-300 hover:text-red-500 p-1.5" title="Excluir"><Trash2 size={15} /></button>
          </>
        )}
        {p.disponivel && (
          <button onClick={onVer} className="btn-primary !py-1.5 !px-3 text-sm flex items-center gap-1.5"><Eye size={14} /> Ver / Baixar</button>
        )}
      </div>
    </div>
  )
}

// ── Nova Solicitação — WIZARD ─────────────────────────────────────────────────
const PASSOS = ['Serviço', 'Partes', 'Caso', 'Entrega']

function NovaSolicitacao({ open, onClose, rascunho, saldo, ehSocio, defaultAdvogado, onComprar, onConcluido, onRascunhoSalvo }) {
  const toast = useToast()
  const { execute, loading } = useAction()
  const [passo, setPasso] = useState(0)
  const [pedidoId, setPedidoId] = useState(rascunho?.id || null)

  const [form, setForm] = useState(() => ({
    tipo_servico: rascunho?.tipo_servico || 'peticao',
    area: rascunho?.area || '',
    sub_area: rascunho?.sub_area || '',
    descricao: rascunho?.descricao || '',
    duvidas: rascunho?.duvidas || '',
    advogado_subscritor: rascunho?.advogado_subscritor || defaultAdvogado,
    tier: rascunho?.tier || 'padrao',
  }))
  const [campos, setCampos] = useState(() => rascunho?.campos || {})
  const [partes, setPartes] = useState(() => (Array.isArray(rascunho?.partes) ? rascunho.partes : []))
  const [anexosServer, setAnexosServer] = useState(() => (Array.isArray(rascunho?.anexos) ? rascunho.anexos : []))
  const [pendentes, setPendentes] = useState([])
  const fileRef = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setCampo = (k, v) => setCampos(c => ({ ...c, [k]: v }))
  const setVal = (f, v) => f.bind ? set(f.bind, v) : setCampo(f.key, v)
  const getVal = (f) => (f.bind ? (form[f.bind] ?? '') : (campos[f.key] ?? ''))

  const fieldsServico = camposServico(form.tipo_servico, campos)
  const fieldsCaso    = camposCaso(form.tipo_servico)
  const partesCfg     = PARTES[form.tipo_servico] || PARTES.peticao

  const totalAnexos = anexosServer.length + pendentes.length
  const needed = TIERS[form.tier].creditos
  const temSaldo = saldo >= needed

  // Ao trocar de serviço, limpa campos que não pertencem mais e reajusta partes.
  useEffect(() => {
    const validas = new Set(camposServico(form.tipo_servico, {}).map(c => c.key)
      .concat(camposServico(form.tipo_servico, { tipo_peticao: 'Inicial' }).map(c => c.key))
      .concat(camposServico(form.tipo_servico, { tipo_peticao: 'Contestação' }).map(c => c.key))
      .concat(camposServico(form.tipo_servico, { tipo_peticao: 'Recursos' }).map(c => c.key))
      .concat(camposCaso(form.tipo_servico).filter(c => c.key).map(c => c.key)))
    setCampos(c => Object.fromEntries(Object.entries(c).filter(([k]) => validas.has(k))))
    const cfg = PARTES[form.tipo_servico] || PARTES.peticao
    if (cfg.modo === 'fixa2') setPartes(ps => normalizarFixa2(ps))
    else setPartes(ps => ps.filter(p => p.tipo !== 'Parte 1' && p.tipo !== 'Parte 2').map(p => cfg.tipos.includes(p.tipo) ? p : { ...p, tipo: cfg.tipos[0] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo_servico])

  useEffect(() => {
    const opts = SUBAREAS[form.area]
    if (opts && form.sub_area && !opts.includes(form.sub_area)) set('sub_area', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.area])

  // Partes
  const addParte = () => setPartes(ps => [...ps, { nome: '', tipo: partesCfg.tipos[0], representada: false }])
  const setParte = (i, k, v) => setPartes(ps => ps.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const rmParte = (i) => setPartes(ps => ps.filter((_, idx) => idx !== i))
  const setFixa = (idx, nome) => setPartes(ps => {
    const base = normalizarFixa2(ps)
    base[idx] = { ...base[idx], nome }
    return base
  })

  // Anexos
  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || [])
    const livres = MAX_ANEXOS - totalAnexos
    if (files.length > livres) toast.error(`Você pode anexar no máximo ${MAX_ANEXOS} arquivos.`)
    setPendentes(ps => [...ps, ...files.slice(0, Math.max(0, livres))])
    if (fileRef.current) fileRef.current.value = ''
  }
  const rmPendente = (i) => setPendentes(ps => ps.filter((_, idx) => idx !== i))
  const rmAnexoServer = async (idx) => {
    if (!pedidoId) return
    try { const r = await pedidosService.removerAnexo(pedidoId, idx); setAnexosServer(r.anexos || []) }
    catch (e) { toast.error(e.message) }
  }

  const payload = () => ({ ...form, campos, partes: partes.filter(p => p.nome?.trim()) })

  async function garantirId() {
    if (pedidoId) { await pedidosService.atualizar(pedidoId, payload()); return pedidoId }
    const novo = await pedidosService.criar(payload()); setPedidoId(novo.id); return novo.id
  }
  async function subirAnexos(id) {
    if (!pendentes.length) return
    const fd = new FormData()
    pendentes.forEach(f => fd.append('arquivos', f))
    const r = await pedidosService.anexar(id, fd)
    setAnexosServer(r.anexos || []); setPendentes([])
  }

  const faltaObrig = (fields) => {
    for (const f of fields) {
      if (!f.required) continue
      const v = getVal(f)
      if (!v || !String(v).trim()) return f.label
    }
    return null
  }
  const podeAvancar = () => {
    if (passo === 0) { const m = faltaObrig(fieldsServico); if (m) { toast.error(`Preencha: ${m}.`); return false } }
    if (passo === 2) { const m = faltaObrig(fieldsCaso); if (m) { toast.error(`Preencha: ${m}.`); return false } }
    return true
  }
  const avancar = () => { if (podeAvancar()) setPasso(p => Math.min(p + 1, PASSOS.length - 1)) }
  const voltar  = () => setPasso(p => Math.max(p - 1, 0))

  const salvarRascunho = () => execute(async () => { const id = await garantirId(); await subirAnexos(id) }, {
    onSuccess: () => { toast.success('Rascunho salvo.'); onRascunhoSalvo() }, onError: (m) => toast.error(m),
  })
  const gerar = () => execute(async () => { const id = await garantirId(); await subirAnexos(id); await pedidosService.confirmar(id) }, {
    onSuccess: () => { toast.success('Pedido enviado! Sua peça está sendo preparada.'); onConcluido() },
    onError: (m) => { if (/insuficiente/i.test(m)) { toast.error('Créditos insuficientes.'); onComprar() } else toast.error(m) },
  })

  const fixas = normalizarFixa2(partes)

  return (
    <Modal open={open} onClose={onClose} title={rascunho ? 'Continuar solicitação' : 'Nova Solicitação'} size="lg">
      <div className="flex items-center gap-2 mb-5">
        {PASSOS.map((nome, i) => (
          <div key={nome} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${i < passo ? 'bg-brand-700 text-white' : i === passo ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-200' : 'bg-gray-100 text-gray-400'}`}>
              {i < passo ? <CheckCircle2 size={13} /> : i + 1}
            </div>
            <span className={`text-xs ${i === passo ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{nome}</span>
            {i < PASSOS.length - 1 && <div className="flex-1 h-px bg-gray-100" />}
          </div>
        ))}
      </div>

      <div className="min-h-[280px]">
        {/* PASSO 1 — Serviço */}
        {passo === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Qual serviço deseja?" required>
                <select className="input" value={form.tipo_servico} onChange={e => set('tipo_servico', e.target.value)}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>
              <FormField label="Área do Direito">
                <select className="input" value={form.area} onChange={e => set('area', e.target.value)}>
                  <option value="">Selecione…</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </FormField>
            </div>

            <SubareaField key={form.area} area={form.area} value={form.sub_area} onChange={v => set('sub_area', v)} />

            {/* Serviços adicionais (Cálculo em breve) */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Serviços adicionais</label>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed select-none">
                <input type="checkbox" disabled className="accent-brand-700" />
                Cálculo <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">em breve</span>
              </label>
            </div>

            {fieldsServico.map(f => <CampoDinamico key={f.key} f={f} value={getVal(f)} onChange={(v) => setVal(f, v)} />)}
          </div>
        )}

        {/* PASSO 2 — Partes */}
        {passo === 1 && (
          partesCfg.modo === 'fixa2' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Informe as partes do processo.</p>
              <FormField label="Parte 01"><input className="input" value={fixas[0].nome} onChange={e => setFixa(0, e.target.value)} placeholder="Nome da Parte 01" /></FormField>
              <FormField label="Parte 02"><input className="input" value={fixas[1].nome} onChange={e => setFixa(1, e.target.value)} placeholder="Nome da Parte 02" /></FormField>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Quem são as partes no processo?</p>
                <button type="button" onClick={addParte} className="btn-ghost flex items-center gap-1 text-xs"><Plus size={13} /> Adicionar parte</button>
              </div>
              {partes.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">Nenhuma parte adicionada. (Opcional)</div>
              ) : (
                <div className="space-y-2">
                  {partes.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input className="input flex-1 min-w-[180px]" placeholder="Nome completo da parte" value={p.nome} onChange={e => setParte(i, 'nome', e.target.value)} />
                      <select className="input !w-44" value={p.tipo} onChange={e => setParte(i, 'tipo', e.target.value)}>
                        {partesCfg.tipos.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={!!p.representada} onChange={e => setParte(i, 'representada', e.target.checked)} className="accent-brand-700" /> É representada
                      </label>
                      <button type="button" onClick={() => rmParte(i)} className="text-gray-300 hover:text-red-500 p-1"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* PASSO 3 — Caso + anexos */}
        {passo === 2 && (
          <div className="space-y-4">
            {fieldsCaso.map(f => <CampoDinamico key={f.bind || f.key} f={f} value={getVal(f)} onChange={(v) => setVal(f, v)} />)}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Documentos do caso <span className="text-gray-400 font-normal">(imagens e PDF, até {MAX_ANEXOS})</span></label>
                <span className="text-xs text-gray-400">{totalAnexos}/{MAX_ANEXOS}</span>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={onPickFiles} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={totalAnexos >= MAX_ANEXOS}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-700 transition-colors flex flex-col items-center gap-1.5 disabled:opacity-50">
                <Paperclip size={18} /> Anexar documentos
                <span className="text-xs text-gray-400">Anexe o que ajudar a personalizar a peça</span>
              </button>
              {(anexosServer.length > 0 || pendentes.length > 0) && (
                <div className="mt-2 space-y-1.5">
                  {anexosServer.map((a, i) => <AnexoRow key={`s${i}`} nome={a.nome} mime={a.mime} onRemove={() => rmAnexoServer(i)} />)}
                  {pendentes.map((f, i) => <AnexoRow key={`p${i}`} nome={f.name} mime={f.type} pendente onRemove={() => rmPendente(i)} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASSO 4 — Entrega */}
        {passo === 3 && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 block">Prazo de entrega</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(TIERS).map(([key, t]) => (
                <button key={key} type="button" onClick={() => set('tier', key)}
                  className={`text-left rounded-xl border p-3 transition-all ${form.tier === key ? 'border-brand-600 ring-2 ring-brand-100 bg-brand-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm flex items-center gap-1.5">{key === 'express' && <Zap size={14} className="text-amber-500" />}{t.label}</span>
                    <span className="badge-gray">{t.creditos} créd.</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t.promessa}</p>
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Serviço</span><span className="text-gray-800 font-medium">{TIPO_LABEL[form.tipo_servico]}{form.area ? ` · ${form.area}` : ''}</span></div>
              {campos.tipo_peticao && <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="text-gray-800">{campos.tipo_peticao}</span></div>}
              {campos.tipo_contrato && <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="text-gray-800">{campos.tipo_contrato}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Documentos anexados</span><span className="text-gray-800">{totalAnexos}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Custo</span><span className="text-gray-800 font-medium">{needed} crédito{needed === 1 ? '' : 's'}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <div>{passo > 0 && <button onClick={voltar} disabled={loading} className="btn-ghost flex items-center gap-1"><ChevronLeft size={15} /> Voltar</button>}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-1">Saldo: <span className={temSaldo ? 'text-gray-600' : 'text-red-500'}>{saldo}</span></span>
          {passo < PASSOS.length - 1 ? (
            <button onClick={avancar} disabled={loading} className="btn-primary flex items-center gap-1.5">Próximo <ChevronRight size={15} /></button>
          ) : (
            <>
              <button onClick={salvarRascunho} disabled={loading} className="btn-secondary">Salvar rascunho</button>
              {temSaldo ? (
                <button onClick={gerar} disabled={loading} className="btn-primary flex items-center gap-1.5">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Gerar agora ({needed} créd.)
                </button>
              ) : ehSocio ? (
                <button onClick={onComprar} className="btn-primary flex items-center gap-1.5"><ShoppingCart size={15} /> Comprar créditos</button>
              ) : (
                <span className="text-xs text-gray-400">Sem saldo — peça a um sócio.</span>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

function normalizarFixa2(ps) {
  const arr = Array.isArray(ps) ? ps.slice(0, 2) : []
  return [
    { nome: arr[0]?.nome || '', tipo: 'Parte 1' },
    { nome: arr[1]?.nome || '', tipo: 'Parte 2' },
  ]
}

// Renderiza um campo do schema conforme o tipo.
function CampoDinamico({ f, value, onChange }) {
  return (
    <FormField label={f.label} required={f.required}>
      {f.type === 'select' ? (
        <select className="input" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Selecione…</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === 'radio' ? (
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {f.options.map(o => (
            <label key={o} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name={f.key || f.bind} checked={value === o} onChange={() => onChange(o)} className="accent-brand-700" /> {o}
            </label>
          ))}
        </div>
      ) : f.type === 'date' ? (
        <input type="date" className="input" value={value} onChange={e => onChange(e.target.value)} />
      ) : f.type === 'textarea' ? (
        <textarea className="input min-h-[90px]" value={value} onChange={e => onChange(e.target.value)} placeholder={f.placeholder || ''} />
      ) : (
        <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={f.placeholder || ''} />
      )}
    </FormField>
  )
}

function AnexoRow({ nome, mime, pendente, onRemove }) {
  const Icon = /^image\//.test(mime || '') ? ImageIcon : FileIcon
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <span className="flex-1 truncate text-gray-700">{nome}</span>
      {pendente && <span className="text-[10px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">pendente</span>}
      <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-500"><X size={15} /></button>
    </div>
  )
}

function SubareaField({ area, value, onChange }) {
  const opts = SUBAREAS[area] || null
  const [outra, setOutra] = useState(!!value && !!opts && !opts.includes(value))
  if (!opts) {
    return (
      <FormField label="Subárea (opcional)">
        <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder="Ex.: Contratual, Indenizatória…" />
      </FormField>
    )
  }
  return (
    <FormField label="Subárea (opcional)">
      <select className="input" value={outra ? '__outra__' : (value || '')}
        onChange={e => { const v = e.target.value; if (v === '__outra__') { setOutra(true); onChange('') } else { setOutra(false); onChange(v) } }}>
        <option value="">Selecione…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__outra__">Outra…</option>
      </select>
      {outra && <input className="input mt-2" value={value} onChange={e => onChange(e.target.value)} placeholder="Especifique a subárea" />}
    </FormField>
  )
}

function CompraCreditos({ open, onClose, packs }) {
  const toast = useToast()
  const { execute, loading } = useAction()
  const [escolhido, setEscolhido] = useState(null)
  const comprar = (creditos) => {
    setEscolhido(creditos)
    execute(() => pedidosService.checkout(creditos), {
      onSuccess: (r) => { window.location.href = r.checkout_url }, onError: (m) => { toast.error(m); setEscolhido(null) },
    })
  }
  return (
    <Modal open={open} onClose={onClose} title="Comprar créditos" size="md">
      <p className="text-sm text-gray-500 mb-4">Cada crédito gera uma peça no Padrão (Express usa 2). Pagamento por Pix ou cartão.</p>
      <div className="space-y-2">
        {packs.map(pk => {
          const porCred = (pk.precoCentavos / 100 / pk.creditos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          return (
            <button key={pk.creditos} disabled={loading} onClick={() => comprar(pk.creditos)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 transition-all p-4 text-left disabled:opacity-60">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2"><Coins size={16} className="text-brand-700" /> {pk.creditos} crédito{pk.creditos === 1 ? '' : 's'}</div>
                <div className="text-xs text-gray-400 mt-0.5">{porCred} por crédito</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{pk.precoLabel}</span>
                {loading && escolhido === pk.creditos ? <Loader2 size={16} className="animate-spin text-brand-700" /> : <ShoppingCart size={16} className="text-gray-400" />}
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

function VerPedido({ pedido, onClose }) {
  const api = useApi(() => pedidosService.detalhe(pedido.id), [pedido.id])
  const p = api.data || pedido
  const baixar = () => window.open(pedidosService.pdfUrl(pedido.id), '_blank')
  return (
    <Modal open onClose={onClose} title={`${TIPO_LABEL[p.tipo_servico] || p.tipo_servico}${p.area ? ' — ' + p.area : ''}`} size="lg">
      {api.loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand-700" /></div>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={baixar} className="btn-primary flex items-center gap-1.5"><Download size={15} /> Baixar PDF</button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 max-h-[55vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-serif text-[13.5px] leading-relaxed text-gray-800">{p.conteudo || 'Conteúdo indisponível.'}</pre>
          </div>
        </>
      )}
    </Modal>
  )
}
