import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Clock, Plus, CheckCircle, Circle, Edit2,
  Upload, FileText, ExternalLink, Trash2, Calendar,
  User, Tag, DollarSign, Play, Square, RotateCcw, Zap, Sparkles, RefreshCw
} from 'lucide-react'
import { useApi, useAction, useCronometro } from '../hooks/useApi.js'
import { processosService, documentosService, agendaService, automacoesService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, ConfirmDialog } from '../components/ui/index.jsx'
import GeradorIA from '../components/GeradorIA.jsx'
import { formatCurrency, formatDate, prazoLabel, prioridadeClass } from '../utils/helpers.js'

const statusClass = s => ({
  'Novo':         'bg-gray-100 text-gray-600',
  'Em Andamento': 'bg-blue-50 text-blue-700',
  'Aguardando':   'bg-amber-50 text-amber-700',
  'Concluído':    'bg-green-50 text-green-700',
}[s] || 'bg-gray-100 text-gray-600')

const TL_ICON = {
  done:    <CheckCircle size={16} className="text-green-600 flex-shrink-0"/>,
  current: <Clock       size={16} className="text-blue-600  flex-shrink-0"/>,
  next:    <Circle      size={16} className="text-gray-300  flex-shrink-0"/>,
}

// ── Templates de documentos padrão ───────────────────────────────────────────
const TEMPLATES_PADRAO = [
  {
    id: 'procuracao',
    nome: 'Procuração Ad Judicia',
    descricao: 'Procuração padrão para representação judicial',
    conteudo: `PROCURAÇÃO AD JUDICIA ET EXTRA

{{nome_cliente}}, {{qualificacao_cliente}}, portador(a) do CPF n.º {{cpf_cliente}}, residente e domiciliado(a) em {{endereco_cliente}}, pelo presente instrumento e na melhor forma de direito, constitui e nomeia como seu bastante procurador(a):

{{nome_advogado}}, Advogado(a), inscrito(a) na OAB sob n.º {{oab_advogado}}, com escritório profissional situado em {{endereco_escritorio}},

conferindo-lhe plenos poderes para o foro em geral, com a cláusula AD JUDICIA ET EXTRA, podendo para tanto propor, contestar e/ou impugnar ações, promover diligências, assinar requerimentos, transigir, firmar acordos, desistir, recorrer, substabelecer com ou sem reservas, e praticar todos os atos necessários ao bom e fiel cumprimento do presente mandato, especialmente no processo: {{titulo_processo}}.

{{cidade_escritorio}}, {{data_atual}}.

_______________________________
{{nome_cliente}}
CPF: {{cpf_cliente}}`
  },
  {
    id: 'contrato_honorarios',
    nome: 'Contrato de Honorários',
    descricao: 'Contrato de prestação de serviços advocatícios',
    conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS

Pelo presente instrumento particular, de um lado:

CONTRATANTE: {{nome_cliente}}, CPF n.º {{cpf_cliente}}, doravante denominado(a) simplesmente CONTRATANTE.

CONTRATADO: {{nome_advogado}}, Advogado(a), OAB n.º {{oab_advogado}}, doravante denominado(a) ADVOGADO(A).

CLÁUSULA 1ª – DO OBJETO
O(A) ADVOGADO(A) obriga-se a prestar os seguintes serviços: patrocínio no processo {{titulo_processo}}.

CLÁUSULA 2ª – DOS HONORÁRIOS
Os honorários advocatícios ficam estabelecidos em R$ {{honorarios}} ({{honorarios_extenso}}), a serem pagos conforme condição a ser acordada entre as partes.

CLÁUSULA 3ª – DO PRAZO
O presente contrato vigorará pelo tempo necessário ao desfecho do processo, podendo ser rescindido por qualquer das partes mediante notificação prévia.

{{cidade_escritorio}}, {{data_atual}}.

_______________________________          _______________________________
{{nome_cliente}}                          {{nome_advogado}}
CPF: {{cpf_cliente}}                      OAB: {{oab_advogado}}`
  },
  {
    id: 'declaracao_hipossuficiencia',
    nome: 'Declaração de Hipossuficiência',
    descricao: 'Para solicitação de gratuidade da justiça',
    conteudo: `DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA

Eu, {{nome_cliente}}, portador(a) do CPF n.º {{cpf_cliente}}, declaro, sob as penas da Lei, que não possuo condições de arcar com as custas e despesas processuais sem prejuízo do sustento próprio ou de minha família, razão pela qual requeiro os benefícios da GRATUIDADE DA JUSTIÇA, nos termos do art. 98 do Código de Processo Civil, no processo {{titulo_processo}}.

Declaro ainda estar ciente de que a falsidade desta declaração constitui ato atentatório à dignidade da justiça, sujeitando-me às sanções previstas no art. 100 do CPC.

{{cidade_escritorio}}, {{data_atual}}.

_______________________________
{{nome_cliente}}
CPF: {{cpf_cliente}}`
  },
]

// ── Componente Cronômetro ─────────────────────────────────────────────────────
function Cronometro({ processoId, horasTotal, onRegistrado }) {
  const toast = useToast()
  const [descricao, setDescricao] = useState('')
  const [modalConfirm, setModalConfirm] = useState(false)
  const [horasParaSalvar, setHorasParaSalvar] = useState(0)

  const crono = useCronometro((horasDecimais) => {
    if (horasDecimais < 0.02) {
      toast.info('Tempo muito curto para registrar.')
      return
    }
    setHorasParaSalvar(horasDecimais)
    setModalConfirm(true)
  })

  async function confirmarRegistro(e) {
    e.preventDefault()
    try {
      await processosService.registrarHoras(processoId, {
        horas: horasParaSalvar,
        descricao,
        data: new Date().toISOString().split('T')[0],
      })
      toast.success(`${horasParaSalvar.toFixed(2)}h registradas com sucesso!`)
      setModalConfirm(false)
      setDescricao('')
      onRegistrado?.()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <div className={`rounded-xl p-4 flex items-center gap-4 transition-colors ${crono.rodando ? 'bg-blue-50 border border-blue-200' : 'bg-brand-50 border border-brand-100'}`}>
        {/* Display */}
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-0.5">
            {crono.rodando ? '⏱ Cronômetro rodando...' : 'Cronômetro de horas'}
          </p>
          <p className={`text-2xl font-mono font-semibold tracking-wider ${crono.rodando ? 'text-blue-700' : 'text-brand-800'}`}>
            {crono.display}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Total acumulado: {parseFloat(horasTotal || 0).toFixed(1)}h</p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          {!crono.rodando ? (
            <button onClick={crono.play}
              className="flex items-center gap-1.5 bg-brand-800 text-white text-xs px-4 py-2.5 rounded-lg hover:bg-brand-900 transition-colors font-medium">
              <Play size={13}/> Iniciar
            </button>
          ) : (
            <>
              <button onClick={crono.stop}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Square size={13}/> Parar e registrar
              </button>
              <button onClick={crono.reset} title="Cancelar"
                className="text-gray-400 hover:text-gray-600 p-2">
                <RotateCcw size={14}/>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal confirmar registro de horas */}
      <Modal open={modalConfirm} onClose={() => setModalConfirm(false)} title="Registrar horas trabalhadas" size="sm">
        <form onSubmit={confirmarRegistro} className="space-y-4">
          <div className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-xs text-brand-600 mb-1">Tempo cronometrado</p>
            <p className="text-3xl font-mono font-bold text-brand-800">{horasParaSalvar.toFixed(2)}h</p>
          </div>
          <FormField label="Descrição da atividade realizada">
            <input className="input" value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Elaboração de petição inicial, audiência de conciliação..." autoFocus/>
          </FormField>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalConfirm(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Confirmar registro</button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ── Gerador de Documentos ─────────────────────────────────────────────────────
function GeradorDocumentos({ processo, onDocumentoGerado }) {
  const toast = useToast()
  const [templateSelecionado, setTemplateSelecionado] = useState(null)
  const [preenchido, setPreenchido] = useState('')
  const [gerando, setGerando] = useState(false)
  const [visivelCliente, setVisivelCliente] = useState(false)

  function selecionarTemplate(t) {
    // Preenche automaticamente com dados do processo
    const hoje = new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })
    let texto = t.conteudo
      .replace(/{{titulo_processo}}/g,    processo?.titulo         || '[TÍTULO DO PROCESSO]')
      .replace(/{{nome_cliente}}/g,        processo?.cliente_nome   || '[NOME DO CLIENTE]')
      .replace(/{{nome_advogado}}/g,       processo?.responsavel_nome || '[NOME DO ADVOGADO]')
      .replace(/{{data_atual}}/g,          hoje)
    setTemplateSelecionado(t)
    setPreenchido(texto)
  }

  async function carregarHtml2pdf() {
    if (window.html2pdf) return
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }

  async function gerarDocumento() {
    setGerando(true)
    try {
      await carregarHtml2pdf()

      // Monta HTML formatado a partir do texto (preserva quebras de linha e indentação)
      const html = `
        <div style="font-family:'Times New Roman',serif;color:#1a1a1a;padding:48px;line-height:1.7;font-size:13px;white-space:pre-wrap">
          ${preenchido.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
        </div>
      `
      const el = document.createElement('div')
      el.innerHTML = html
      document.body.appendChild(el)

      const nomeArquivo = `${templateSelecionado.nome.replace(/\s+/g,'-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

      // Gera o PDF como Blob (em vez de salvar direto) para podermos
      // tanto baixar quanto, opcionalmente, enviar para os Documentos do processo.
      const worker = window.html2pdf(el, {
        margin:      [15, 15, 15, 15],
        filename:    nomeArquivo,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })

      const pdfBlob = await worker.outputPdf('blob')
      document.body.removeChild(el)

      // Sempre baixa para o usuário
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url; a.download = nomeArquivo
      a.click()
      URL.revokeObjectURL(url)

      // Também envia para os Documentos do processo, respeitando a visibilidade escolhida
      if (onDocumentoGerado) {
        const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' })
        await onDocumentoGerado(file, visivelCliente)
      }

      toast.success(`"${templateSelecionado.nome}" gerado em PDF${visivelCliente ? ' e disponibilizado ao cliente' : ''}!`)
    } catch (err) {
      toast.error('Falha ao gerar PDF: ' + err.message)
    } finally {
      setGerando(false)
    }
  }

  if (!templateSelecionado) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-3">Selecione um modelo para gerar com os dados deste processo:</p>
        {TEMPLATES_PADRAO.map(t => (
          <button key={t.id} onClick={() => selecionarTemplate(t)}
            className="w-full text-left p-3 bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 rounded-xl transition-all group">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-brand-600 flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700">{t.nome}</p>
                <p className="text-xs text-gray-400">{t.descricao}</p>
              </div>
              <span className="text-xs text-brand-600 font-medium opacity-0 group-hover:opacity-100">Usar →</span>
            </div>
          </button>
        ))}
        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-700">
            <strong>💡 Dica:</strong> As variáveis <code className="bg-amber-100 px-1 rounded">{'{{nome_cliente}}'}</code> são preenchidas automaticamente com os dados cadastrados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">{templateSelecionado.nome}</p>
        <button onClick={() => setTemplateSelecionado(null)} className="btn-ghost text-xs text-gray-500">← Voltar</button>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Conteúdo do documento — edite os campos em <code className="bg-gray-100 px-1 rounded">{'[COLCHETES]'}</code>:
        </label>
        <textarea
          className="input font-mono text-xs resize-y"
          rows={16}
          value={preenchido}
          onChange={e => setPreenchido(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 rounded-lg p-3">
        <input type="checkbox" checked={visivelCliente}
          onChange={e => setVisivelCliente(e.target.checked)}
          className="rounded"/>
        Disponibilizar este documento no portal do cliente
      </label>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setTemplateSelecionado(null)} className="btn-secondary">Cancelar</button>
        <button onClick={gerarDocumento} disabled={gerando}
          className="btn-primary flex items-center gap-2">
          {gerando
            ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
            : <FileText size={13}/>
          }
          Gerar PDF
        </button>
      </div>
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function ProcessoDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const { data: processo, loading, error, refetch: refetchProc } = useApi(() => processosService.buscar(id), [id])
  const { data: timeline, refetch: refetchTl }                   = useApi(() => processosService.timeline(id), [id])
  const { data: docs,     refetch: refetchDocs }                 = useApi(() => documentosService.listar({ processo_id: id }), [id])
  const { data: eventos }                                        = useApi(() => agendaService.listar({ limit: 50 }), [])
  const { data: movimentacoes, refetch: refetchMov }             = useApi(() => processosService.movimentacoes(id), [id])
  const { execute: execSincronizar, loading: sincronizando }     = useAction()

  const [tab, setTab] = useState('timeline')
  const [modalTl,        setModalTl]        = useState(false)
  const [modalEdit,      setModalEdit]      = useState(false)
  const [modalUpload,    setModalUpload]    = useState(false)
  const [modalHorasManual, setModalHorasManual] = useState(false)
  const [modalTemplates, setModalTemplates] = useState(false)
  const [modalIA, setModalIA] = useState(false)
  const [modalFaturar,   setModalFaturar]   = useState(false)
  const [faturando,      setFaturando]      = useState(false)
  const [valorHoraFaturar, setValorHoraFaturar] = useState('300')
  const [confirmDelDoc,  setConfirmDelDoc]  = useState(null)

  const [tlForm,    setTlForm]    = useState({ titulo: '', descricao: '', data_evento: '', status: 'next', visivel_cliente: true, avisar_cliente: false })
  const [editForm,  setEditForm]  = useState({})
  const [horasForm, setHorasForm] = useState({ horas: '', descricao: '', data: new Date().toISOString().split('T')[0] })
  const [file,      setFile]      = useState(null)
  const [fileVisivelCliente, setFileVisivelCliente] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const { execute: execDelDoc, loading: deletingDoc } = useAction()

  const eventosProcesso = (Array.isArray(eventos) ? eventos : []).filter(e => e.processo_id === id)

  async function handleAdicionarTimeline(e) {
    e.preventDefault(); setSaving(true)
    try {
      await processosService.adicionarTimeline(id, tlForm)
      toast.success('Evento adicionado à timeline!')
      setModalTl(false)
      setTlForm({ titulo: '', descricao: '', data_evento: '', status: 'next', visivel_cliente: true, avisar_cliente: false })
      refetchTl()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleEditarProcesso(e) {
    e.preventDefault(); setSaving(true)
    try {
      await processosService.atualizar(id, editForm)
      toast.success('Processo atualizado!')
      setModalEdit(false)
      refetchProc()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleSincronizarDataJud() {
    await execSincronizar(() => processosService.sincronizarDataJud(id), {
      onSuccess: (res) => {
        toast.success(res.mensagem || 'Processo sincronizado com os tribunais.')
        refetchProc(); refetchMov(); setTab('movimentacoes')
      },
      onError: (msg) => toast.error(msg),
    })
  }

  const [traduzindoId, setTraduzindoId] = useState(null)
  async function handleTraduzirMov(movId) {
    setTraduzindoId(movId)
    try {
      await processosService.traduzirMov(id, movId)
      toast.success('Tradução gerada! Marque "visível no portal" para o cliente ver.')
      refetchMov()
    } catch (err) {
      toast.error(err.message || 'Não foi possível traduzir agora.')
    } finally {
      setTraduzindoId(null)
    }
  }

  async function handleVisibilidadeMov(movId, visivel) {
    try {
      await processosService.visibilidadeMov(id, movId, visivel)
      refetchMov()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleRegistrarHorasManual(e) {
    e.preventDefault(); setSaving(true)
    try {
      await processosService.registrarHoras(id, { ...horasForm, horas: parseFloat(horasForm.horas) })
      toast.success('Horas registradas!')
      setModalHorasManual(false)
      setHorasForm({ horas: '', descricao: '', data: new Date().toISOString().split('T')[0] })
      refetchProc()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      fd.append('processo_id', id)
      // cliente_id é necessário para o documento aparecer no portal do cliente
      // quando marcado como visível — sem isso, o filtro do portal nunca encontra o registro.
      if (processo?.cliente_id) fd.append('cliente_id', processo.cliente_id)
      fd.append('visivel_cliente', String(fileVisivelCliente))
      await documentosService.upload(fd)
      toast.success('Documento enviado!')
      setModalUpload(false); setFile(null); setFileVisivelCliente(false); refetchDocs()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  // Usado pelo GeradorDocumentos: envia o PDF gerado direto para os Documentos do processo
  async function handleDocumentoGerado(pdfFile, visivelCliente) {
    const fd = new FormData()
    fd.append('arquivo', pdfFile)
    fd.append('processo_id', id)
    if (processo?.cliente_id) fd.append('cliente_id', processo.cliente_id)
    fd.append('visivel_cliente', String(visivelCliente))
    await documentosService.upload(fd)
    refetchDocs()
  }

  async function handleDeleteDoc() {
    await execDelDoc(() => documentosService.remover(confirmDelDoc.id), {
      onSuccess: () => { toast.success('Documento removido.'); setConfirmDelDoc(null); refetchDocs() },
      onError: msg => toast.error(msg),
    })
  }

  async function handleFaturarHoras(e) {
    e.preventDefault()
    setFaturando(true)
    try {
      const resultado = await automacoesService.faturarHoras(id, { valor_hora: parseFloat(valorHoraFaturar) })
      toast.success(`Cobrança de ${formatCurrency(resultado.valor_total)} gerada (${resultado.total_horas.toFixed(1)}h × ${formatCurrency(resultado.valor_hora)})!`)
      setModalFaturar(false)
      refetchProc()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setFaturando(false)
    }
  }

  if (loading) return <LoadingScreen/>
  if (error)   return <ErrorBlock message={error} onRetry={refetchProc}/>
  if (!processo) return null

  const { label: prazoLbl, class: prazoCls } = prazoLabel(processo.prazo)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Voltar */}
      <button onClick={() => navigate('/processos')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft size={14}/> Voltar para processos
      </button>

      {/* Header card */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge ${statusClass(processo.status)}`}>{processo.status}</span>
              <span className={`badge ${prioridadeClass(processo.prioridade)}`}>{processo.prioridade}</span>
              {processo.prazo && <span className={`badge ${prazoCls}`}>{prazoLbl}</span>}
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{processo.titulo}</h1>
            {processo.numero && <p className="text-sm font-mono text-gray-400 mt-0.5">{processo.numero}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setModalTemplates(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Zap size={12}/> Gerar documento
            </button>
            <button onClick={() => setModalIA(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Sparkles size={12}/> Gerar com IA
            </button>
            <button onClick={() => {
              setEditForm({
                status: processo.status,
                prioridade: processo.prioridade,
                prazo: processo.prazo?.split('T')[0] || '',
                descricao: processo.descricao || '',
                honorarios: processo.honorarios || '',
              })
              setModalEdit(true)
            }} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              <Edit2 size={12}/> Editar
            </button>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { icon: User,     label: 'Cliente',     value: processo.cliente_nome     || '—' },
            { icon: User,     label: 'Responsável', value: processo.responsavel_nome || '—' },
            { icon: Tag,      label: 'Área',        value: processo.area             || '—' },
            { icon: Calendar, label: 'Prazo',       value: processo.prazo ? formatDate(processo.prazo) : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} className="text-gray-400"/>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Cronômetro integrado */}
        <Cronometro
          processoId={id}
          horasTotal={processo.horas_total}
          onRegistrado={() => { refetchProc() }}
        />

        {/* Honorários + registrar manual */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
            <DollarSign size={18} className="text-green-600"/>
            <div>
              <p className="text-xs text-green-600 font-medium">Honorários</p>
              <p className="text-lg font-semibold text-green-800">
                {processo.honorarios ? formatCurrency(processo.honorarios) : '—'}
              </p>
            </div>
          </div>
          <button onClick={() => setModalHorasManual(true)}
            className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left">
            <Clock size={18} className="text-gray-400"/>
            <div>
              <p className="text-xs text-gray-500 font-medium">Lançamento manual</p>
              <p className="text-xs text-gray-400">Registrar horas sem cronômetro</p>
            </div>
          </button>
        </div>

        {/* Faturar horas acumuladas */}
        {parseFloat(processo.horas_total || 0) > 0 && (
          <button onClick={() => setModalFaturar(true)}
            className="w-full mt-3 bg-brand-50 border border-brand-100 rounded-xl p-3 flex items-center gap-3 hover:bg-brand-100 transition-colors text-left">
            <Zap size={18} className="text-brand-600 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs text-brand-700 font-medium">Faturar horas acumuladas</p>
              <p className="text-xs text-brand-500">Converter {parseFloat(processo.horas_total).toFixed(1)}h em cobrança automaticamente</p>
            </div>
            <span className="text-xs text-brand-600 font-medium">Gerar cobrança →</span>
          </button>
        )}

        {processo.descricao && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 leading-relaxed">{processo.descricao}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
        {[['timeline','Timeline'],['movimentacoes','Movimentações'],['documentos','Documentos'],['agenda','Agenda']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${tab===k?'bg-white text-gray-900 font-medium shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── MOVIMENTAÇÕES (DataJud) ─────────────────────────────────────────── */}
      {tab === 'movimentacoes' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-1 gap-3 flex-wrap">
            <p className="text-sm font-medium text-gray-800">Movimentações processuais</p>
            <button onClick={handleSincronizarDataJud} disabled={sincronizando}
              className="btn-primary text-xs flex items-center gap-1.5">
              <RefreshCw size={12} className={sincronizando ? 'animate-spin' : ''}/>
              {sincronizando ? 'Sincronizando...' : 'Sincronizar com tribunais'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Dados públicos da base nacional do CNJ (DataJud).
            {processo.datajud_sincronizado_em && ` Última sincronização: ${formatDate(processo.datajud_sincronizado_em)}.`}
          </p>

          {(processo.tribunal || processo.classe_judicial || processo.orgao_julgador) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-3 bg-gray-50 rounded-xl text-xs">
              {processo.tribunal          && <div><p className="text-gray-400">Tribunal</p><p className="text-gray-800 font-medium">{processo.tribunal}</p></div>}
              {processo.classe_judicial   && <div><p className="text-gray-400">Classe</p><p className="text-gray-800 font-medium">{processo.classe_judicial}</p></div>}
              {processo.assunto_principal && <div><p className="text-gray-400">Assunto</p><p className="text-gray-800 font-medium">{processo.assunto_principal}</p></div>}
              {processo.orgao_julgador    && <div><p className="text-gray-400">Órgão julgador</p><p className="text-gray-800 font-medium">{processo.orgao_julgador}</p></div>}
            </div>
          )}

          {(!movimentacoes || movimentacoes.length === 0) ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400">Nenhuma movimentação sincronizada ainda.</p>
              <p className="text-xs text-gray-400 mt-1">
                Clique em "Sincronizar com tribunais" para buscar as movimentações pelo número do processo.
                {!processo.numero && ' Cadastre primeiro o número CNJ do processo (botão Editar).'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {(Array.isArray(movimentacoes) ? movimentacoes : []).map((m, i) => (
                <li key={m.id || i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5"/>
                    {i < movimentacoes.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1"/>}
                  </div>
                  <div className="pb-3 flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{m.descricao}</p>
                    {m.data_hora && <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.data_hora)}</p>}

                    {/* Versão em linguagem simples (traduzida pela IA) */}
                    {m.descricao_simples && (
                      <div className="mt-2 bg-accent-50 border border-accent-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-accent-800"><Sparkles size={11} className="inline mr-1 -mt-0.5"/>{m.descricao_simples}</p>
                      </div>
                    )}

                    {/* Ações: traduzir + visível ao cliente */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <button
                        onClick={() => handleTraduzirMov(m.id)}
                        disabled={traduzindoId === m.id}
                        className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 disabled:opacity-50">
                        <Sparkles size={11} className={traduzindoId === m.id ? 'animate-pulse' : ''}/>
                        {traduzindoId === m.id ? 'Traduzindo...' : (m.descricao_simples ? 'Traduzir de novo' : 'Traduzir p/ cliente')}
                      </button>

                      {m.descricao_simples && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                          <input type="checkbox" checked={!!m.visivel_portal}
                            onChange={(e) => handleVisibilidadeMov(m.id, e.target.checked)}
                            className="rounded border-gray-300"/>
                          Visível no portal do cliente
                        </label>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── TIMELINE ────────────────────────────────────────────────────────── */}
      {tab === 'timeline' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-medium text-gray-800">Linha do tempo processual</p>
            <button onClick={() => setModalTl(true)} className="btn-secondary text-xs flex items-center gap-1">
              <Plus size={12}/> Adicionar evento
            </button>
          </div>
          {(!timeline || timeline.length === 0)
            ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">Nenhum evento na timeline.</p>
                <button onClick={() => setModalTl(true)} className="btn-primary text-xs mt-3">+ Adicionar primeiro evento</button>
              </div>
            ) : (
              <div className="space-y-0">
                {(Array.isArray(timeline) ? timeline : []).map((item, i) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="mt-1">{TL_ICON[item.status]}</div>
                      {i < timeline.length - 1 && (
                        <div className={`w-0.5 flex-1 my-2 ${item.status==='done'?'bg-green-200':'bg-gray-100'}`}
                          style={{minHeight:32}}/>
                      )}
                    </div>
                    <div className={`flex-1 pb-6 ${item.status==='next'?'opacity-50':''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.titulo}</p>
                          {item.data_evento && <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.data_evento)}</p>}
                          {item.descricao && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.descricao}</p>}
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          {!item.visivel_cliente && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Interno</span>
                          )}
                          <span className={`badge text-[10px] ${
                            item.status==='done'    ? 'badge-green' :
                            item.status==='current' ? 'badge-blue'  : 'badge-gray'
                          }`}>
                            {{done:'Concluído',current:'Em andamento',next:'Pendente'}[item.status]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── DOCUMENTOS ──────────────────────────────────────────────────────── */}
      {tab === 'documentos' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-800">Documentos do processo</p>
            <div className="flex gap-2">
              <button onClick={() => setModalTemplates(true)} className="btn-ghost text-xs flex items-center gap-1">
                <Zap size={12}/> Gerar documento
              </button>
              <button onClick={() => setModalUpload(true)} className="btn-secondary text-xs flex items-center gap-1">
                <Upload size={12}/> Enviar arquivo
              </button>
            </div>
          </div>
          {!docs || docs.length === 0
            ? <div className="text-center py-10 text-sm text-gray-400">Nenhum documento enviado ainda.</div>
            : (
              <div className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50">
                    <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-brand-700"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.enviado_por || 'Sistema'} · {formatDate(doc.criado_em)}
                        {doc.tamanho_bytes && ` · ${(doc.tamanho_bytes/1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    {doc.visivel_cliente && <span className="badge badge-green text-[10px]">Visível ao cliente</span>}
                    <a href={documentosService.download(doc.id)} target="_blank" rel="noreferrer"
                      className="btn-ghost text-xs p-1.5"><ExternalLink size={13}/></a>
                    <button onClick={() => setConfirmDelDoc(doc)} className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── AGENDA ──────────────────────────────────────────────────────────── */}
      {tab === 'agenda' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-800">Eventos vinculados a este processo</p>
          </div>
          {eventosProcesso.length === 0
            ? <div className="text-center py-10 text-sm text-gray-400">Nenhum evento de agenda vinculado.</div>
            : eventosProcesso.map(ev => {
                const dt = new Date(ev.data_hora)
                return (
                  <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ev.tipo==='Audiência'?'bg-red-400':ev.tipo==='Prazo'?'bg-amber-400':'bg-blue-400'}`}/>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{ev.titulo}</p>
                      {ev.local && <p className="text-xs text-gray-400 mt-0.5">{ev.local}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-700">{dt.toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-400">{dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                    <span className={`badge text-[10px] ${
                      ev.tipo==='Audiência'?'badge-red':ev.tipo==='Prazo'?'badge-amber':'badge-blue'
                    }`}>{ev.tipo}</span>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* ── MODAIS ──────────────────────────────────────────────────────────── */}

      {/* Adicionar evento na timeline */}
      <Modal open={modalTl} onClose={() => setModalTl(false)} title="Adicionar evento à timeline" size="md">
        <form onSubmit={handleAdicionarTimeline} className="space-y-4">
          <FormField label="Título do evento" required>
            <input className="input" value={tlForm.titulo}
              onChange={e => setTlForm(f => ({...f, titulo: e.target.value}))} required
              placeholder="Ex: Audiência de instrução realizada"/>
          </FormField>
          <FormField label="Descrição em linguagem simples (visível ao cliente)">
            <textarea className="input resize-none" rows={2} value={tlForm.descricao}
              onChange={e => setTlForm(f => ({...f, descricao: e.target.value}))}
              placeholder="Ex: O juiz ouviu as testemunhas. A decisão será proferida em 30 dias."/>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data do evento">
              <input type="date" className="input" value={tlForm.data_evento}
                onChange={e => setTlForm(f => ({...f, data_evento: e.target.value}))}/>
            </FormField>
            <FormField label="Status">
              <select className="input" value={tlForm.status}
                onChange={e => setTlForm(f => ({...f, status: e.target.value}))}>
                <option value="done">✅ Concluído</option>
                <option value="current">🔵 Em andamento</option>
                <option value="next">⬜ Pendente</option>
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={tlForm.visivel_cliente}
              onChange={e => setTlForm(f => ({...f, visivel_cliente: e.target.checked}))}
              className="rounded"/>
            Visível para o cliente no portal
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!tlForm.avisar_cliente}
              onChange={e => setTlForm(f => ({...f, avisar_cliente: e.target.checked}))}
              className="rounded"/>
            Avisar o cliente por e-mail
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalTl(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Adicionar evento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Editar processo */}
      <Modal open={modalEdit} onClose={() => setModalEdit(false)} title="Editar processo" size="sm">
        <form onSubmit={handleEditarProcesso} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Status">
              <select className="input" value={editForm.status || ''}
                onChange={e => setEditForm(f => ({...f, status: e.target.value}))}>
                {['Novo','Em Andamento','Aguardando','Concluído'].map(s=><option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Prioridade">
              <select className="input" value={editForm.prioridade || ''}
                onChange={e => setEditForm(f => ({...f, prioridade: e.target.value}))}>
                {['Alta','Médio','Baixo'].map(p=><option key={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Prazo">
              <input type="date" className="input" value={editForm.prazo || ''}
                onChange={e => setEditForm(f => ({...f, prazo: e.target.value}))}/>
            </FormField>
            <FormField label="Honorários (R$)">
              <input type="number" step="0.01" className="input" value={editForm.honorarios || ''}
                onChange={e => setEditForm(f => ({...f, honorarios: e.target.value}))}/>
            </FormField>
          </div>
          <FormField label="Observações do processo">
            <textarea className="input resize-none" rows={3} value={editForm.descricao || ''}
              onChange={e => setEditForm(f => ({...f, descricao: e.target.value}))}/>
          </FormField>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalEdit(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving?'Salvando...':'Salvar'}</button>
          </div>
        </form>
      </Modal>

      {/* Registrar horas manualmente */}
      <Modal open={modalHorasManual} onClose={() => setModalHorasManual(false)} title="Lançamento manual de horas" size="sm">
        <form onSubmit={handleRegistrarHorasManual} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Horas" required>
              <input type="number" step="0.25" min="0.25" className="input" value={horasForm.horas}
                onChange={e => setHorasForm(f => ({...f, horas: e.target.value}))} required placeholder="Ex: 1.5"/>
            </FormField>
            <FormField label="Data">
              <input type="date" className="input" value={horasForm.data}
                onChange={e => setHorasForm(f => ({...f, data: e.target.value}))}/>
            </FormField>
          </div>
          <FormField label="Descrição da atividade">
            <input className="input" value={horasForm.descricao}
              onChange={e => setHorasForm(f => ({...f, descricao: e.target.value}))}
              placeholder="Ex: Elaboração de petição inicial"/>
          </FormField>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalHorasManual(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving?'Salvando...':'Registrar'}</button>
          </div>
        </form>
      </Modal>

      {/* Upload documento */}
      <Modal open={modalUpload} onClose={() => { setModalUpload(false); setFileVisivelCliente(false) }} title="Enviar documento" size="sm">
        <form onSubmit={handleUpload} className="space-y-4">
          <FormField label="Arquivo" required>
            <input type="file" className="input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => setFile(e.target.files[0])} required/>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 rounded-lg p-3">
            <input type="checkbox" checked={fileVisivelCliente}
              onChange={e => setFileVisivelCliente(e.target.checked)}
              className="rounded"/>
            Disponibilizar este documento no portal do cliente
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setModalUpload(false); setFileVisivelCliente(false) }} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving || !file} className="btn-primary">{saving?'Enviando...':'Enviar'}</button>
          </div>
        </form>
      </Modal>

      {/* Faturar horas acumuladas */}
      <Modal open={modalFaturar} onClose={() => setModalFaturar(false)} title="Faturar horas acumuladas" size="sm">
        <form onSubmit={handleFaturarHoras} className="space-y-4">
          <div className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-xs text-brand-600 mb-1">Total de horas no processo</p>
            <p className="text-2xl font-mono font-bold text-brand-800">{parseFloat(processo.horas_total || 0).toFixed(1)}h</p>
          </div>
          <FormField label="Valor da hora técnica (R$)" required>
            <input type="number" step="0.01" min="0.01" className="input" value={valorHoraFaturar}
              onChange={e => setValorHoraFaturar(e.target.value)} required/>
          </FormField>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Valor estimado da cobrança</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(parseFloat(processo.horas_total || 0) * parseFloat(valorHoraFaturar || 0))}
            </span>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            💡 Uma cobrança será criada automaticamente no módulo financeiro com vencimento em 10 dias.
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setModalFaturar(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={faturando} className="btn-primary flex items-center gap-2">
              {faturando && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
              Gerar cobrança
            </button>
          </div>
        </form>
      </Modal>

      {/* Gerador de documentos */}
      <Modal open={modalTemplates} onClose={() => setModalTemplates(false)} title="Gerador de documentos" size="lg">
        <GeradorDocumentos processo={processo} onDocumentoGerado={handleDocumentoGerado}/>
      </Modal>

      {/* Gerador de documentos via IA — peça simples, petição, procuração */}
      <Modal open={modalIA} onClose={() => setModalIA(false)} title="Gerar documento com IA" size="lg">
        <GeradorIA processo={processo}/>
      </Modal>

      <ConfirmDialog open={!!confirmDelDoc} onClose={() => setConfirmDelDoc(null)} onConfirm={handleDeleteDoc}
        title="Remover documento" description={`Remover "${confirmDelDoc?.nome}" permanentemente?`}
        danger loading={deletingDoc}/>
    </div>
  )
}
