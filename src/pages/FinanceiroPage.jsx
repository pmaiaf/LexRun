import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Plus, Send, CheckCircle, Zap, Copy, ExternalLink, Mail, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApi, useAction } from '../hooks/useApi.js'
import { financeiroService, clientesService, automacoesService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, EmptyState } from '../components/ui/index.jsx'
import { formatCurrency, formatDate, statusCobrancaClass } from '../utils/helpers.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>)}
    </div>
  )
}

const FORM_VAZIO = { cliente_id: '', descricao: '', valor: '', vencimento: '', metodo: 'Boleto' }

export default function FinanceiroPage() {
  const toast = useToast()
  const now = new Date()

  const { data: kpis,    loading: l1, error: e1, errorObj: eo1, refetch: r1 } = useApi(() => financeiroService.dashboard({ mes: now.getMonth()+1, ano: now.getFullYear() }), [])
  const { data: cobData, loading: l2, refetch: r2 }             = useApi(() => financeiroService.cobrancas(), [])
  const { data: cliData }                                        = useApi(() => clientesService.listar({ limit: 200 }), [])
  const { data: mpStatus }                                       = useApi(() => automacoesService.statusMercadoPago(), [])

  const [modalCob,   setModalCob]   = useState(false)
  const [form,       setForm]       = useState(FORM_VAZIO)
  const [saving,     setSaving]     = useState(false)
  const [gerandoId,  setGerandoId]  = useState(null)
  const [resultadoMP, setResultadoMP] = useState(null) // { cobranca, pix_copia_cola, boleto_url, checkout_url, email }
  const [escolherMetodo, setEscolherMetodo] = useState(null) // cobrança selecionada para escolher método
  const [dadosPagamento, setDadosPagamento] = useState('')
  const [enviandoManual, setEnviandoManual] = useState(false)
  const [resultadoManual, setResultadoManual] = useState(null)
  const { execute } = useAction()

  const cobrancas    = cobData?.data || []
  const clientes      = cliData?.data || []
  const receita       = kpis?.receita_mensal || []
  const fluxo         = kpis?.fluxo_caixa   || []
  const mpConectado   = !!mpStatus?.conectado

  async function handleCriarCobranca(e) {
    e.preventDefault()
    if (!form.cliente_id) { toast.error('Selecione um cliente.'); return }
    setSaving(true)
    try {
      await financeiroService.criarCobranca({
        cliente_id:  form.cliente_id,
        descricao:   form.descricao,
        valor:       parseFloat(form.valor),
        vencimento:  form.vencimento,
        metodo:      form.metodo,
      })
      toast.success('Cobrança criada! Escolha como enviá-la na lista abaixo.')
      setModalCob(false)
      setForm(FORM_VAZIO)
      r2(); r1()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleGerarMercadoPago(id, cobrancaRef) {
    setGerandoId(id)
    try {
      const resultado = await automacoesService.gerarCobrancaMercadoPago(id)
      setEscolherMetodo(null)
      setResultadoMP({ ...resultado, cobranca: cobrancaRef || cobrancas.find(c => c.id === id) })
      if (resultado.email?.enviado) {
        toast.success('Pix, Boleto e Checkout gerados! E-mail enviado ao cliente.')
      } else {
        toast.success('Pix, Boleto e Checkout gerados!')
        if (resultado.email?.motivo) toast.warning(`E-mail não enviado: ${resultado.email.motivo}`)
      }
      r2()
    } catch (err) {
      if (err.detalhes?.precisa_conectar || err.message?.includes('não conectado')) {
        toast.error('Conecte o Mercado Pago em Configurações > Integrações primeiro.')
      } else {
        toast.error(err.message)
      }
    } finally {
      setGerandoId(null)
    }
  }

  async function handleEnviarManual(e) {
    e.preventDefault()
    if (!dadosPagamento.trim()) { toast.error('Descreva os dados de pagamento.'); return }
    setEnviandoManual(true)
    try {
      await automacoesService.enviarCobrancaManual(escolherMetodo.id, dadosPagamento)
      setResultadoManual({ cobranca: escolherMetodo })
      setEscolherMetodo(null)
      setDadosPagamento('')
      toast.success('E-mail enviado ao cliente com os dados de pagamento!')
      r2()
    } catch (err) { toast.error(err.message) }
    finally { setEnviandoManual(false) }
  }

  async function handlePagar(id) {
    await execute(() => financeiroService.marcarPago(id), {
      onSuccess: () => { toast.success('Pagamento registrado!'); r2(); r1() },
      onError: msg => toast.error(msg),
    })
  }

  async function handleReenviarEmail(id) {
    await execute(() => automacoesService.reenviarEmailCobranca(id), {
      onSuccess: (res) => {
        if (res.enviado) toast.success('E-mail reenviado!')
        else toast.warning(res.motivo || 'Não foi possível reenviar.')
      },
      onError: msg => toast.error(msg),
    })
  }

  function copiar(texto, label) {
    navigator.clipboard.writeText(texto)
    toast.success(`${label} copiado!`)
  }

  if (l1 && !kpis) return <LoadingScreen />
  if (e1)          return <ErrorBlock message={e1} error={eo1} onRetry={r1} />

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500">{now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>
        </div>
        {!mpConectado && (
          <a href="/configuracoes" className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">
            <AlertTriangle size={12}/> Conecte o Mercado Pago para cobranças automáticas
          </a>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Receita do Mês',  value: kpis?.receita_mes,   icon: DollarSign,   color:'bg-brand-100 text-brand-700' },
          { label:'Despesas',        value: kpis?.despesas_mes,  icon: TrendingDown, color:'bg-red-50 text-red-500'      },
          { label:'Lucro Líquido',   value: kpis?.lucro_mes,     icon: TrendingUp,   color:'bg-green-50 text-green-600'  },
          { label:'Inadimplência',   value: kpis?.inadimplencia, icon: AlertCircle,  color:'bg-amber-50 text-amber-600'  },
        ].map(m => (
          <div key={m.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{m.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color}`}><m.icon size={15}/></div>
            </div>
            {l1
              ? <div className="h-7 w-24 bg-gray-100 rounded animate-pulse"/>
              : <p className="text-xl font-semibold text-gray-900">{m.value != null ? formatCurrency(m.value) : '—'}</p>
            }
          </div>
        ))}
      </div>

      {/* Gráficos — renderização condicional (evita gráfico fantasma) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-4">Receita vs Pendente</p>
          {l1 ? <div className="h-48 bg-gray-50 rounded-xl animate-pulse"/>
           : receita.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={receita} margin={{top:4,right:4,left:-18,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="mes" tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="receita"  name="Receita"  fill="#1B2E4B" radius={[3,3,0,0]}/>
                <Bar dataKey="pendente" name="Pendente" fill="#FCA5A5" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-400 font-medium">Sem dados de receita neste período</p>
              <p className="text-xs text-gray-300 mt-1">Registre cobranças para visualizar o gráfico</p>
            </div>
          )}
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-800 mb-4">Fluxo de caixa — semanas do mês</p>
          {l1 ? <div className="h-48 bg-gray-50 rounded-xl animate-pulse"/>
           : fluxo.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fluxo} margin={{top:4,right:4,left:-18,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="semana" tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`Sem ${v}`}/>
                <YAxis tick={{fontSize:11,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="entradas" name="Entradas" fill="#0EA5A0" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-400 font-medium">Sem fluxo de caixa neste período</p>
              <p className="text-xs text-gray-300 mt-1">Os dados aparecerão conforme cobranças forem lançadas</p>
            </div>
          )}
        </div>
      </div>

      {/* Cobranças */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-800">Cobranças</p>
            <p className="text-xs text-gray-400">{cobrancas.length} registros</p>
          </div>
          <button onClick={() => setModalCob(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <Plus size={12}/> Nova cobrança
          </button>
        </div>
        {l2 ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-50 rounded animate-pulse"/>)}</div>
        ) : cobrancas.length === 0 ? (
          <EmptyState icon={DollarSign} title="Nenhuma cobrança ainda" subtitle="Crie a primeira cobrança para um cliente"/>
        ) : (
          <div className="divide-y divide-gray-50">
            {cobrancas.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{c.cliente_nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.descricao} · Vence {formatDate(c.vencimento)}</p>
                </div>
                {c.pix_copia_cola && <span className="badge badge-blue text-[10px] hidden sm:inline-flex">MP gerado</span>}
                {c.email_enviado_em && <span title={`E-mail enviado em ${formatDate(c.email_enviado_em)}`} className="text-gray-300"><Mail size={12}/></span>}
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(c.valor)}</span>
                <span className={`badge ${statusCobrancaClass(c.status)}`}>{c.status}</span>

                {c.status !== 'Pago' && c.status !== 'Cancelado' && (
                  <div className="flex gap-1 flex-shrink-0">
                    {!c.pix_copia_cola && c.metodo !== 'Email manual' ? (
                      <button onClick={() => setEscolherMetodo(c)} disabled={gerandoId === c.id}
                        title="Escolher como gerar esta cobrança"
                        className="btn-primary text-xs px-2 py-1 flex items-center gap-1">
                        {gerandoId === c.id
                          ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                          : <Zap size={11}/>
                        }
                        Gerar cobrança
                      </button>
                    ) : c.pix_copia_cola ? (
                      <>
                        <button onClick={() => setResultadoMP({ cobranca: c, pix_copia_cola: c.pix_copia_cola, boleto_url: c.boleto_url, checkout_url: c.checkout_url })}
                          title="Ver Pix / Boleto / Checkout"
                          className="btn-ghost text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 flex items-center gap-1">
                          <Zap size={11}/> Ver links
                        </button>
                        <button onClick={() => handleReenviarEmail(c.id)} title="Reenviar e-mail"
                          className="btn-ghost text-xs px-2 py-1 flex items-center gap-1">
                          <Send size={11}/>
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEscolherMetodo(c)} title="Reenviar e-mail com dados de pagamento"
                        className="btn-ghost text-xs px-2 py-1 flex items-center gap-1">
                        <Send size={11}/> Reenviar
                      </button>
                    )}
                    <button onClick={() => handlePagar(c.id)} title="Marcar como pago"
                      className="btn-ghost text-xs px-2 py-1 text-green-600 hover:bg-green-50 flex items-center gap-1">
                      <CheckCircle size={12}/>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nova cobrança */}
      <Modal open={modalCob} onClose={() => { setModalCob(false); setForm(FORM_VAZIO) }} title="Nova cobrança">
        <form onSubmit={handleCriarCobranca} className="space-y-4">
          <FormField label="Cliente" required>
            <select className="input" value={form.cliente_id}
              onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))} required>
              <option value="">Selecione o cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Descrição" required>
            <input className="input" placeholder="Ex: Honorários — Ação Bancária (1/3)"
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} required/>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor (R$)" required>
              <input type="number" step="0.01" min="0.01" className="input"
                value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required
                placeholder="0,00"/>
            </FormField>
            <FormField label="Vencimento" required>
              <input type="date" className="input"
                value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} required/>
            </FormField>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex items-center gap-2">
            <Zap size={13} className="flex-shrink-0 text-gray-400"/>
            Depois de criar, você escolhe na lista como enviar: Mercado Pago (automático) ou e-mail manual.
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => { setModalCob(false); setForm(FORM_VAZIO) }} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
              Criar cobrança
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal escolha de método — sempre perguntado, mesmo com MP conectado */}
      <Modal open={!!escolherMetodo} onClose={() => { setEscolherMetodo(null); setDadosPagamento('') }} title="Como enviar esta cobrança?" size="sm">
        {escolherMetodo && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{escolherMetodo.cliente_nome} · {escolherMetodo.descricao}</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(escolherMetodo.valor)}</p>
            </div>

            <button onClick={() => handleGerarMercadoPago(escolherMetodo.id, escolherMetodo)} disabled={gerandoId === escolherMetodo.id || !mpConectado}
              className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3
                ${mpConectado ? 'border-gray-100 hover:border-brand-300 hover:bg-brand-50' : 'border-gray-100 opacity-50 cursor-not-allowed'}`}>
              <Zap size={18} className="text-brand-600 flex-shrink-0 mt-0.5"/>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Mercado Pago (automático)</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {mpConectado
                    ? 'Gera Pix, Boleto e Checkout e envia por e-mail automaticamente.'
                    : 'Conecte sua conta em Configurações > Integrações para usar esta opção.'}
                </p>
              </div>
              {gerandoId === escolherMetodo.id && <span className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin flex-shrink-0"/>}
            </button>

            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <Mail size={18} className="text-gray-500 flex-shrink-0 mt-0.5"/>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">E-mail manual</p>
                  <p className="text-xs text-gray-400 mt-0.5">Escreva os dados de pagamento (Pix, conta bancária, link externo etc.) e envie por e-mail.</p>
                </div>
              </div>
              <form onSubmit={handleEnviarManual} className="space-y-2">
                <textarea className="input resize-none text-xs" rows={3}
                  placeholder="Ex: Pix (CPF): 000.000.000-00&#10;Banco: Nubank, Ag 0001, CC 123456-7"
                  value={dadosPagamento} onChange={e => setDadosPagamento(e.target.value)} required/>
                <button type="submit" disabled={enviandoManual} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
                  {enviandoManual && <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"/>}
                  Enviar por e-mail
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmação envio manual */}
      <Modal open={!!resultadoManual} onClose={() => setResultadoManual(null)} title="E-mail enviado" size="sm">
        {resultadoManual && (
          <div className="text-center space-y-3 py-2">
            <CheckCircle size={32} className="text-green-500 mx-auto"/>
            <p className="text-sm text-gray-700">
              Dados de pagamento enviados para <strong>{resultadoManual.cobranca.cliente_nome}</strong>.
            </p>
            <button onClick={() => setResultadoManual(null)} className="btn-secondary w-full">Fechar</button>
          </div>
        )}
      </Modal>

      {/* Modal resultado Mercado Pago — Pix / Boleto / Checkout */}
      <Modal open={!!resultadoMP} onClose={() => setResultadoMP(null)} title="Cobrança gerada" size="sm">
        {resultadoMP && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">{resultadoMP.cobranca?.descricao}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(resultadoMP.cobranca?.valor)}</p>
            </div>

            {resultadoMP.pix_copia_cola && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Pix copia e cola</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[10px] font-mono text-gray-500 truncate">
                    {resultadoMP.pix_copia_cola}
                  </div>
                  <button onClick={() => copiar(resultadoMP.pix_copia_cola, 'Código Pix')} className="btn-secondary text-xs px-3">
                    <Copy size={12}/>
                  </button>
                </div>
              </div>
            )}

            {resultadoMP.boleto_url && (
              <a href={resultadoMP.boleto_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors">
                <span className="text-sm text-gray-700">Boleto bancário</span>
                <ExternalLink size={13} className="text-gray-400"/>
              </a>
            )}

            {resultadoMP.checkout_url && (
              <a href={resultadoMP.checkout_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-2.5 transition-colors">
                <span className="text-sm text-brand-700 font-medium">Checkout completo (cartão, boleto ou Pix)</span>
                <ExternalLink size={13} className="text-brand-500"/>
              </a>
            )}

            {resultadoMP.email && (
              <p className="text-xs text-center text-gray-400">
                {resultadoMP.email.enviado ? '✓ E-mail enviado ao cliente automaticamente' : `E-mail não enviado: ${resultadoMP.email.motivo}`}
              </p>
            )}

            <button onClick={() => setResultadoMP(null)} className="btn-secondary w-full">Fechar</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
