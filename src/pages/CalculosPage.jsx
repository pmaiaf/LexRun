import { useState, useEffect } from 'react'
import {
  Calculator, Plus, ArrowLeft, Trash2, Sparkles, Loader2,
  FileText, ChevronRight, AlertTriangle, Check
} from 'lucide-react'
import { calculosService } from '../services/api.js'
import { useApi, useAction } from '../hooks/useApi.js'
import { LoadingScreen, ErrorBlock, EmptyState, FormField, useToast } from '../components/ui/index.jsx'

// Áreas e sub-áreas (Cível tem camada extra). Espelha o backend (calculosTipos.js).
const AREAS = ['Trabalhista', 'Previdenciario', 'Administrativo', 'Civel', 'Criminal']
const SUBAREAS_CIVEL = ['Consumidor', 'Obrigacoes', 'Contratuais', 'Sucessoes', 'Familia', 'Empresarial', 'Possessorias', 'Imobiliario', 'ResponsabilidadeCivil']
const INDICES = ['IPCAE', 'INPC', 'IGPM', 'TR']

const fmtBRL = v => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
const fmtData = d => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')

const statusBadge = s => ({
  rascunho: 'badge-gray', estruturado: 'badge-blue', calculado: 'badge-green', erro: 'badge-red',
}[s] || 'badge-gray')

export default function CalculosPage() {
  const [view, setView] = useState('lista') // 'lista' | 'editor'
  const [atual, setAtual] = useState(null)   // cálculo em edição/visualização
  const { data: lista, loading, error, refetch } = useApi(() => calculosService.listar(), [])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorBlock error={error} onRetry={refetch} />

  if (view === 'editor') {
    return <Editor calculo={atual} onVoltar={() => { setView('lista'); setAtual(null); refetch() }} />
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calculator size={20} className="text-brand-700" /> Cálculos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Atualização e correção de débitos com índices oficiais do Banco Central.</p>
        </div>
        <button onClick={() => { setAtual(null); setView('editor') }} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Novo cálculo
        </button>
      </div>

      {(!lista || lista.length === 0)
        ? <EmptyState icon={Calculator} title="Nenhum cálculo ainda"
            subtitle="Crie um cálculo de atualização de débito — o sistema aplica IPCA-E e SELIC (ADC 58) com índices oficiais." />
        : (
          <div className="card divide-y divide-gray-50">
            {lista.map(c => (
              <button key={c.id} onClick={() => { setAtual(c); setView('editor') }}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 text-left transition-colors">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.tipo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.area}{c.sub_area ? ` · ${c.sub_area}` : ''} · {fmtData(c.criado_em)}</p>
                </div>
                {c.valor_final != null && <span className="text-sm font-semibold text-gray-800">{fmtBRL(c.valor_final)}</span>}
                <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        )}
    </div>
  )
}

function novaParcela() {
  return { descricao: '', valor: '', dataDebito: '', indiceCorrecao: 'IPCAE', jurosMoraMesPct: 0 }
}

function Editor({ calculo, onVoltar }) {
  const toast = useToast()
  const editando = !!calculo
  const est = calculo?.estrutura || {}

  const [area, setArea] = useState(calculo?.area || 'Civel')
  const [subArea, setSubArea] = useState(calculo?.sub_area || '')
  const [tipo, setTipo] = useState(calculo?.tipo || '')
  const [relato, setRelato] = useState(est.relato || '')
  const [dataAjuizamento, setDataAjuizamento] = useState(est.dataAjuizamento || '')
  const [dataCitacao, setDataCitacao] = useState(est.dataCitacao || '')
  const [dataFinal, setDataFinal] = useState(est.dataFinal || '')
  const [parcelas, setParcelas] = useState(est.parcelas?.length ? est.parcelas : [novaParcela()])
  const [multaPct, setMultaPct] = useState(est.multaPct ?? 10)
  const [honorariosPct, setHonorariosPct] = useState(est.honorariosPct ?? 10)
  const [custas, setCustas] = useState(est.custas ?? '')
  const [pagouEm15, setPagouEm15] = useState(est.houvePagamento15Dias || false)
  const [valorFinanciado, setValorFinanciado] = useState(est.valorFinanciado ?? '')
  const [numParcelas, setNumParcelas] = useState(est.numParcelas ?? '')
  const [taxaContratadaMes, setTaxaContratadaMes] = useState(est.taxaContratadaMes ?? '')
  const [taxaRevisadaMes, setTaxaRevisadaMes] = useState(est.taxaRevisadaMes ?? '')
  const [parcelasPagas, setParcelasPagas] = useState(est.parcelasPagas ?? '')
  const [emDobro, setEmDobro] = useState(est.emDobro || false)
  const [numParc916, setNumParc916] = useState(est.numParcelas ?? 6)
  const [valorAluguel, setValorAluguel] = useState(est.valorAluguel ?? '')
  const [indiceAluguel, setIndiceAluguel] = useState(est.indice ?? 'IGPM')
  const [valorCobrado, setValorCobrado] = useState(est.valorCobrado ?? '')
  const [aluguelIni, setAluguelIni] = useState(est.dataInicial ?? '')
  const [aluguelFim, setAluguelFim] = useState(est.dataFinal ?? '')
  const [valorBase, setValorBase] = useState(est.valorBase ?? '')
  const [difIni, setDifIni] = useState(est.dataInicial ?? '')
  const [difFim, setDifFim] = useState(est.dataFinal ?? '')
  const [indiceAplicado, setIndiceAplicado] = useState(est.indiceAplicado ?? 'TR')
  const [indicePretendido, setIndicePretendido] = useState(est.indicePretendido ?? 'IPCA')
  const [bens, setBens] = useState(est.bens?.length ? est.bens : [{ valor: '' }])
  const [dividas, setDividas] = useState(est.dividas ?? '')
  const [despesas, setDespesas] = useState(est.despesas ?? '')
  const [meacao, setMeacao] = useState(est.meacao || false)
  const [herdeiros, setHerdeiros] = useState(est.herdeiros ?? 1)
  const [salarioResc, setSalarioResc] = useState(est.salario ?? '')
  const [admissao, setAdmissao] = useState(est.dataAdmissao ?? '')
  const [demissao, setDemissao] = useState(est.dataDemissao ?? '')
  const [diasTrabMes, setDiasTrabMes] = useState(est.diasTrabalhadosMes ?? 30)
  const [feriasVencidas, setFeriasVencidas] = useState(est.feriasVencidas || false)
  const [saldoFGTS, setSaldoFGTS] = useState(est.saldoFGTS ?? '')
  const [verbasTrab, setVerbasTrab] = useState(est.verbas?.length ? est.verbas : [{ descricao: '', valorBase: '', dataInicio: '', incideINSS: true, incideFGTS: true }])
  const [resultado, setResultado] = useState(calculo?.resultado || null)
  const [idCalc, setIdCalc] = useState(calculo?.id || null)

  const [tiposDisp, setTiposDisp] = useState([])
  const { execute: execEstruturar, loading: estruturando } = useAction()
  const { execute: execCalcular, loading: calculando } = useAction()

  const ehCivel = area === 'Civel'
  const ehCumprimento = /cumprimento de senten/i.test(tipo)
  const ehAluguel = /aluguel/i.test(tipo)
  const eh916 = /916/.test(tipo) || /parcelamento de d[eé]bitos em execu/i.test(tipo)
  const ehDiferenca = /fgts|pis[\/ ]?pasep|plano de sa[uú]de/i.test(tipo)
  const ehPartilha = /partilha|invent[aá]rio/i.test(tipo)
  const ehRescisao = /rescis[aã]o de contrato de trabalho/i.test(tipo)
  const ehLiquidacaoTrab = /liquida[çc][aã]o de verbas trabalhistas/i.test(tipo)
  const ehRevisional = /revisional/i.test(tipo) && !ehAluguel && !ehDiferenca

  // carrega os tipos da área/subárea
  useEffect(() => {
    if (ehCivel && !subArea) { setTiposDisp([]); return }
    calculosService.tipos(area, subArea).then(r => setTiposDisp(r.tipos || [])).catch(() => setTiposDisp([]))
  }, [area, subArea, ehCivel])

  function setParcela(i, campo, val) {
    setParcelas(ps => ps.map((p, idx) => idx === i ? { ...p, [campo]: val } : p))
  }
  function montarEstrutura() {
    if (ehRescisao) {
      return { salario: Number(salarioResc), dataAdmissao: admissao, dataDemissao: demissao, diasTrabalhadosMes: Number(diasTrabMes) || 30, feriasVencidas, saldoFGTS: Number(saldoFGTS) || 0 }
    }
    if (ehLiquidacaoTrab) {
      return { dataAjuizamento, dataCitacao: dataCitacao || null, dataFinal, verbas: verbasTrab.filter(v => v.valorBase !== '' && v.dataInicio).map(v => ({ descricao: v.descricao || 'Verba', valorBase: Number(v.valorBase), dataInicio: v.dataInicio, incideINSS: !!v.incideINSS, incideFGTS: !!v.incideFGTS })) }
    }
    if (ehDiferenca) {
      return { valorBase: Number(valorBase), dataInicial: difIni, dataFinal: difFim, indiceAplicado, indicePretendido }
    }
    if (ehPartilha) {
      return { bens: bens.filter(b => b.valor !== '').map(b => ({ valor: Number(b.valor) })), dividas: Number(dividas) || 0, despesas: Number(despesas) || 0, meacao, herdeiros: Number(herdeiros) || 1 }
    }
    if (ehAluguel) {
      return { valorAluguel: Number(valorAluguel), dataInicial: aluguelIni, dataFinal: aluguelFim, indice: indiceAluguel, valorCobrado: valorCobrado === '' ? null : Number(valorCobrado) }
    }
    if (ehRevisional) {
      return {
        valorFinanciado: Number(valorFinanciado),
        numParcelas: Number(numParcelas),
        taxaContratadaMes: Number(taxaContratadaMes),
        taxaRevisadaMes: Number(taxaRevisadaMes),
        parcelasPagas: parcelasPagas === '' ? Number(numParcelas) : Number(parcelasPagas),
        emDobro,
      }
    }
    const base = {
      relato, dataAjuizamento, dataCitacao: dataCitacao || null, dataFinal,
      parcelas: parcelas
        .filter(p => p.valor !== '' && p.dataDebito)
        .map(p => ({ ...p, valor: Number(p.valor), jurosMoraMesPct: Number(p.jurosMoraMesPct) || 0 })),
    }
    if (ehCumprimento) {
      base.multaPct = Number(multaPct) || 0
      base.honorariosPct = Number(honorariosPct) || 0
      base.custas = Number(custas) || 0
      base.houvePagamento15Dias = pagouEm15
    }
    if (eh916) {
      base.honorariosPct = Number(honorariosPct) || 0
      base.custas = Number(custas) || 0
      base.numParcelas = Number(numParc916) || 6
    }
    return base
  }

  async function estruturarIA() {
    if (!tipo) return toast.error('Escolha o tipo de cálculo.')
    await execEstruturar(
      () => calculosService.estruturar({ area, subArea: ehCivel ? subArea : null, tipo, contexto: { relato, numeroProcesso: est.numeroProcesso } }),
      {
        onSuccess: (c) => {
          setIdCalc(c.id)
          const e = c.estrutura || {}
          if (e.parcelas?.length) setParcelas(e.parcelas)
          if (e.dataAjuizamento) setDataAjuizamento(e.dataAjuizamento)
          if (e.dataCitacao) setDataCitacao(e.dataCitacao)
          if (e.dataFinal) setDataFinal(e.dataFinal)
          toast.success('Estruturado pela IA — revise as parcelas antes de calcular.')
        },
        onError: msg => toast.error(msg),
      }
    )
  }

  async function calcular() {
    const estrutura = montarEstrutura()
    if (ehRescisao) {
      if (!estrutura.salario || !estrutura.dataAdmissao || !estrutura.dataDemissao) return toast.error('Informe salário e datas de admissão/demissão (AAAA-MM).')
    } else if (ehLiquidacaoTrab) {
      if (!estrutura.verbas.length) return toast.error('Adicione ao menos uma verba (valor + data).')
      if (!dataAjuizamento || !dataFinal) return toast.error('Informe ajuizamento e data final.')
    } else if (ehDiferenca) {
      if (!estrutura.valorBase || !estrutura.dataInicial || !estrutura.dataFinal) return toast.error('Informe o valor-base e as datas (AAAA-MM).')
    } else if (ehPartilha) {
      if (!estrutura.bens.length) return toast.error('Informe ao menos um bem.')
    } else if (ehAluguel) {
      if (!estrutura.valorAluguel || !estrutura.dataInicial || !estrutura.dataFinal) return toast.error('Informe o aluguel e as datas (AAAA-MM).')
    } else if (ehRevisional) {
      if (!estrutura.valorFinanciado || !estrutura.numParcelas) return toast.error('Informe valor financiado e número de parcelas.')
      if (!estrutura.taxaContratadaMes || !estrutura.taxaRevisadaMes) return toast.error('Informe a taxa contratada e a taxa pretendida.')
    } else {
      if (!estrutura.parcelas.length) return toast.error('Adicione ao menos uma parcela (valor + data do débito).')
      if (!dataAjuizamento || !dataFinal) return toast.error('Informe a data de ajuizamento e a data final.')
    }

    // garante um registro persistido (criação MANUAL, sem depender da IA)
    let id = idCalc
    if (!id) {
      try {
        const c = await calculosService.criar({ area, subArea: ehCivel ? subArea : null, tipo: tipo || 'Atualização de Débitos Judiciais', estrutura })
        id = c.id; setIdCalc(id)
      } catch (e) { return toast.error(e.message || 'Não foi possível criar o cálculo.') }
    }

    await execCalcular(
      () => calculosService.calcular(id, estrutura),
      {
        onSuccess: (c) => { setResultado(c.resultado); setIdCalc(c.id); toast.success('Cálculo concluído.') },
        onError: msg => toast.error(msg),
      }
    )
  }

  const tipoAtivoSel = tiposDisp.find(t => t.tipo === tipo)?.ativo

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={onVoltar} className="btn-ghost text-sm flex items-center gap-1 mb-4">
        <ArrowLeft size={15} /> Voltar
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-1">{editando ? 'Cálculo' : 'Novo cálculo'}</h1>
      <p className="text-sm text-gray-400 mb-6">Metodologia ADC 58/STF: IPCA-E até a citação, SELIC simples depois.</p>

      {/* Tipo */}
      <div className="card p-5 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Área">
            <select className="input" value={area} onChange={e => { setArea(e.target.value); setSubArea(''); setTipo('') }}>
              {AREAS.map(a => <option key={a} value={a}>{a === 'Previdenciario' ? 'Previdenciário' : a === 'Civel' ? 'Cível' : a}</option>)}
            </select>
          </FormField>
          {ehCivel && (
            <FormField label="Sub-área">
              <select className="input" value={subArea} onChange={e => { setSubArea(e.target.value); setTipo('') }}>
                <option value="">Selecione…</option>
                {SUBAREAS_CIVEL.map(s => <option key={s} value={s}>{s === 'ResponsabilidadeCivil' ? 'Responsabilidade Civil' : s}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Tipo de cálculo">
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value)} disabled={ehCivel && !subArea}>
              <option value="">Selecione…</option>
              {tiposDisp.map(t => <option key={t.tipo} value={t.tipo} disabled={!t.ativo}>{t.tipo}{t.ativo ? '' : ' (em breve)'}</option>)}
            </select>
          </FormField>
        </div>
        {tipo && tipoAtivoSel === false && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5"><AlertTriangle size={13} /> Este tipo ainda não está disponível para cálculo automático.</p>
        )}
      </div>

      {/* Datas */}
      {!ehRevisional && !ehAluguel && !ehDiferenca && !ehPartilha && !ehRescisao && <div className="card p-5 mb-4">
        <p className="text-sm font-medium text-gray-800 mb-3">Datas do processo</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Ajuizamento (AAAA-MM)"><input className="input" placeholder="2024-04" value={dataAjuizamento} onChange={e => setDataAjuizamento(e.target.value)} /></FormField>
          <FormField label="Citação (opcional)"><input className="input" placeholder="2024-05" value={dataCitacao} onChange={e => setDataCitacao(e.target.value)} /></FormField>
          <FormField label="Data final (AAAA-MM)"><input className="input" placeholder="2026-06" value={dataFinal} onChange={e => setDataFinal(e.target.value)} /></FormField>
        </div>
      </div>}

      {/* Financiamento (Revisional Price) */}
      {ehRevisional && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Dados do financiamento</p>
          <p className="text-xs text-gray-400 mb-3">Recálculo pela Tabela Price. Você informa a taxa contratada e a taxa que pretende discutir — o sistema não decide abusividade.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Valor financiado (R$)"><input className="input" type="number" step="0.01" value={valorFinanciado} onChange={e => setValorFinanciado(e.target.value)} /></FormField>
            <FormField label="Nº de parcelas"><input className="input" type="number" value={numParcelas} onChange={e => setNumParcelas(e.target.value)} /></FormField>
            <FormField label="Parcelas já pagas"><input className="input" type="number" placeholder="todas" value={parcelasPagas} onChange={e => setParcelasPagas(e.target.value)} /></FormField>
            <FormField label="Taxa contratada (% a.m.)"><input className="input" type="number" step="0.01" value={taxaContratadaMes} onChange={e => setTaxaContratadaMes(e.target.value)} /></FormField>
            <FormField label="Taxa pretendida (% a.m.)"><input className="input" type="number" step="0.01" value={taxaRevisadaMes} onChange={e => setTaxaRevisadaMes(e.target.value)} /></FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-3">
            <input type="checkbox" checked={emDobro} onChange={e => setEmDobro(e.target.checked)} />
            Restituição em dobro (art. 42, § único, CDC)
          </label>
        </div>
      )}

      {/* Rescisão */}
      {ehRescisao && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Dados da rescisão (sem justa causa)</p>
          <p className="text-xs text-gray-400 mb-3">Saldo de salário, aviso prévio, 13º e férias proporcionais, multa de 40% do FGTS. INSS pela tabela vigente.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Salário (R$)"><input className="input" type="number" step="0.01" value={salarioResc} onChange={e => setSalarioResc(e.target.value)} /></FormField>
            <FormField label="Admissão (AAAA-MM)"><input className="input" placeholder="2022-01" value={admissao} onChange={e => setAdmissao(e.target.value)} /></FormField>
            <FormField label="Demissão (AAAA-MM)"><input className="input" placeholder="2024-06" value={demissao} onChange={e => setDemissao(e.target.value)} /></FormField>
            <FormField label="Dias trabalhados no mês"><input className="input" type="number" value={diasTrabMes} onChange={e => setDiasTrabMes(e.target.value)} /></FormField>
            <FormField label="Saldo FGTS (p/ multa 40%)"><input className="input" type="number" step="0.01" value={saldoFGTS} onChange={e => setSaldoFGTS(e.target.value)} /></FormField>
            <FormField label="Férias vencidas?">
              <label className="flex items-center gap-2 text-sm text-gray-700 h-[42px]"><input type="checkbox" checked={feriasVencidas} onChange={e => setFeriasVencidas(e.target.checked)} /> Há período vencido</label>
            </FormField>
          </div>
        </div>
      )}

      {/* Liquidação trabalhista — verbas */}
      {ehLiquidacaoTrab && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-800">Verbas da liquidação</p>
            <button onClick={() => setVerbasTrab(vs => [...vs, { descricao: '', valorBase: '', dataInicio: '', incideINSS: true, incideFGTS: true }])} className="btn-ghost text-xs flex items-center gap-1"><Plus size={13} /> Adicionar verba</button>
          </div>
          <p className="text-xs text-gray-400 mb-3">Cada verba é corrigida (ADC 58). FGTS 8% e INSS incidem conforme marcado. Estimativa para sua revisão.</p>
          <div className="space-y-2">
            {verbasTrab.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className="input col-span-12 sm:col-span-4" placeholder="Verba (ex.: horas extras)" value={v.descricao} onChange={e => setVerbasTrab(vs => vs.map((x, idx) => idx === i ? { ...x, descricao: e.target.value } : x))} />
                <input className="input col-span-5 sm:col-span-2" type="number" step="0.01" placeholder="Valor" value={v.valorBase} onChange={e => setVerbasTrab(vs => vs.map((x, idx) => idx === i ? { ...x, valorBase: e.target.value } : x))} />
                <input className="input col-span-5 sm:col-span-2" placeholder="2024-01" value={v.dataInicio} onChange={e => setVerbasTrab(vs => vs.map((x, idx) => idx === i ? { ...x, dataInicio: e.target.value } : x))} />
                <label className="col-span-3 sm:col-span-1 flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" checked={v.incideINSS} onChange={e => setVerbasTrab(vs => vs.map((x, idx) => idx === i ? { ...x, incideINSS: e.target.checked } : x))} /> INSS</label>
                <label className="col-span-3 sm:col-span-1 flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" checked={v.incideFGTS} onChange={e => setVerbasTrab(vs => vs.map((x, idx) => idx === i ? { ...x, incideFGTS: e.target.checked } : x))} /> FGTS</label>
                <button onClick={() => setVerbasTrab(vs => vs.filter((_, idx) => idx !== i))} className="btn-ghost p-1.5 text-red-500 col-span-1"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diferença de índice (FGTS / PIS-PASEP / Plano de Saúde) */}
      {ehDiferenca && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Revisão por índice</p>
          <p className="text-xs text-gray-400 mb-3">Compara a correção pelo índice aplicado vs. o pretendido e apura a diferença (ex.: FGTS — TR x IPCA).</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Valor-base (R$)"><input className="input" type="number" step="0.01" value={valorBase} onChange={e => setValorBase(e.target.value)} /></FormField>
            <FormField label="Índice aplicado">
              <select className="input" value={indiceAplicado} onChange={e => setIndiceAplicado(e.target.value)}>
                {['TR','IPCA','IPCAE','INPC','IGPM'].map(ix => <option key={ix} value={ix}>{ix}</option>)}
              </select>
            </FormField>
            <FormField label="Índice pretendido">
              <select className="input" value={indicePretendido} onChange={e => setIndicePretendido(e.target.value)}>
                {['IPCA','IPCAE','INPC','IGPM','TR'].map(ix => <option key={ix} value={ix}>{ix}</option>)}
              </select>
            </FormField>
            <FormField label="Data inicial (AAAA-MM)"><input className="input" placeholder="2020-01" value={difIni} onChange={e => setDifIni(e.target.value)} /></FormField>
            <FormField label="Data final (AAAA-MM)"><input className="input" placeholder="2024-12" value={difFim} onChange={e => setDifFim(e.target.value)} /></FormField>
          </div>
        </div>
      )}

      {/* Partilha (Inventário) */}
      {ehPartilha && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Partilha de bens</p>
          <p className="text-xs text-gray-400 mb-3">Monte-mor − dívidas/despesas = líquido; meação (50%) ao cônjuge; o restante é dividido entre os herdeiros.</p>
          <div className="space-y-2 mb-3">
            {bens.map((b, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input flex-1" type="number" step="0.01" placeholder={`Bem ${i + 1} (R$)`} value={b.valor} onChange={e => setBens(bs => bs.map((x, idx) => idx === i ? { valor: e.target.value } : x))} />
                <button onClick={() => setBens(bs => bs.filter((_, idx) => idx !== i))} className="btn-ghost p-2 text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
            <button onClick={() => setBens(bs => [...bs, { valor: '' }])} className="btn-ghost text-xs flex items-center gap-1"><Plus size={13} /> Adicionar bem</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField label="Dívidas (R$)"><input className="input" type="number" step="0.01" value={dividas} onChange={e => setDividas(e.target.value)} /></FormField>
            <FormField label="Despesas (R$)"><input className="input" type="number" step="0.01" value={despesas} onChange={e => setDespesas(e.target.value)} /></FormField>
            <FormField label="Nº de herdeiros"><input className="input" type="number" min="1" value={herdeiros} onChange={e => setHerdeiros(e.target.value)} /></FormField>
            <FormField label="Meação?">
              <label className="flex items-center gap-2 text-sm text-gray-700 h-[42px]"><input type="checkbox" checked={meacao} onChange={e => setMeacao(e.target.checked)} /> Cônjuge (50%)</label>
            </FormField>
          </div>
        </div>
      )}

      {/* Aluguel */}
      {ehAluguel && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Reajuste do aluguel</p>
          <p className="text-xs text-gray-400 mb-3">Atualiza o aluguel pelo índice contratual no período (índices oficiais do Banco Central).</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Valor do aluguel (R$)"><input className="input" type="number" step="0.01" value={valorAluguel} onChange={e => setValorAluguel(e.target.value)} /></FormField>
            <FormField label="Índice">
              <select className="input" value={indiceAluguel} onChange={e => setIndiceAluguel(e.target.value)}>
                {['IGPM','IPCA','INPC'].map(ix => <option key={ix} value={ix}>{ix === 'IGPM' ? 'IGP-M' : ix}</option>)}
              </select>
            </FormField>
            <FormField label="Valor cobrado (opcional)"><input className="input" type="number" step="0.01" placeholder="p/ apurar diferença" value={valorCobrado} onChange={e => setValorCobrado(e.target.value)} /></FormField>
            <FormField label="Data base (AAAA-MM)"><input className="input" placeholder="2024-01" value={aluguelIni} onChange={e => setAluguelIni(e.target.value)} /></FormField>
            <FormField label="Data final (AAAA-MM)"><input className="input" placeholder="2024-12" value={aluguelFim} onChange={e => setAluguelFim(e.target.value)} /></FormField>
          </div>
        </div>
      )}

      {/* Parcelamento art. 916 */}
      {eh916 && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Parcelamento (art. 916, CPC)</p>
          <p className="text-xs text-gray-400 mb-3">Entrada de 30% do valor em execução + saldo em até 6 parcelas com juros de 1% a.m.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Honorários (%)"><input className="input" type="number" step="0.1" value={honorariosPct} onChange={e => setHonorariosPct(e.target.value)} /></FormField>
            <FormField label="Custas (R$)"><input className="input" type="number" step="0.01" value={custas} onChange={e => setCustas(e.target.value)} /></FormField>
            <FormField label="Nº de parcelas (até 6)"><input className="input" type="number" min="1" max="6" value={numParc916} onChange={e => setNumParc916(e.target.value)} /></FormField>
          </div>
        </div>
      )}

      {/* Art. 523 CPC (só para Cumprimento de Sentença) */}
      {ehCumprimento && (
        <div className="card p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-1">Acréscimos da execução (art. 523, CPC)</p>
          <p className="text-xs text-gray-400 mb-3">Multa e honorários incidem sobre o débito atualizado quando não há pagamento voluntário em 15 dias.</p>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
            <input type="checkbox" checked={pagouEm15} onChange={e => setPagouEm15(e.target.checked)} />
            Houve pagamento voluntário no prazo (sem multa e honorários)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Multa (%)"><input className="input" type="number" step="0.1" value={multaPct} disabled={pagouEm15} onChange={e => setMultaPct(e.target.value)} /></FormField>
            <FormField label="Honorários (%)"><input className="input" type="number" step="0.1" value={honorariosPct} disabled={pagouEm15} onChange={e => setHonorariosPct(e.target.value)} /></FormField>
            <FormField label="Custas (R$)"><input className="input" type="number" step="0.01" value={custas} onChange={e => setCustas(e.target.value)} /></FormField>
          </div>
        </div>
      )}

      {/* Estruturar com IA (opcional) */}
      {!ehRevisional && !ehAluguel && !ehDiferenca && !ehPartilha && !ehRescisao && !ehLiquidacaoTrab && <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-800">Estruturar com IA <span className="text-gray-400 font-normal">(opcional)</span></p>
          <button onClick={estruturarIA} disabled={estruturando || !tipo}
            className="btn-secondary text-xs flex items-center gap-1.5">
            {estruturando ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Estruturar parcelas
          </button>
        </div>
        <textarea className="input min-h-[80px]" placeholder="Descreva o caso: valores, datas de vencimento, índice contratual… A IA monta as parcelas para você revisar."
          value={relato} onChange={e => setRelato(e.target.value)} />
      </div>}

      {/* Parcelas (revisáveis) */}
      {!ehRevisional && !ehAluguel && !ehDiferenca && !ehPartilha && !ehRescisao && !ehLiquidacaoTrab && <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-800">Parcelas</p>
          <button onClick={() => setParcelas(ps => [...ps, novaParcela()])} className="btn-ghost text-xs flex items-center gap-1"><Plus size={13} /> Adicionar parcela</button>
        </div>
        <div className="space-y-3">
          {parcelas.map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-4">
                <label className="text-xs text-gray-400">Descrição</label>
                <input className="input" placeholder="Ex.: Principal" value={p.descricao} onChange={e => setParcela(i, 'descricao', e.target.value)} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-gray-400">Valor (R$)</label>
                <input className="input" type="number" step="0.01" value={p.valor} onChange={e => setParcela(i, 'valor', e.target.value)} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-gray-400">Vencimento</label>
                <input className="input" placeholder="2024-01" value={p.dataDebito} onChange={e => setParcela(i, 'dataDebito', e.target.value)} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-xs text-gray-400">Índice</label>
                <select className="input" value={p.indiceCorrecao} onChange={e => setParcela(i, 'indiceCorrecao', e.target.value)}>
                  {INDICES.map(ix => <option key={ix} value={ix}>{ix === 'IPCAE' ? 'IPCA-E' : ix}</option>)}
                </select>
              </div>
              <div className="col-span-8 sm:col-span-1">
                <label className="text-xs text-gray-400">Juros %/mês</label>
                <input className="input" type="number" step="0.1" value={p.jurosMoraMesPct} onChange={e => setParcela(i, 'jurosMoraMesPct', e.target.value)} />
              </div>
              <div className="col-span-4 sm:col-span-1 flex justify-end">
                <button onClick={() => setParcelas(ps => ps.filter((_, idx) => idx !== i))} className="btn-ghost p-2 text-red-500" title="Remover"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>}

      <div className="flex justify-end mb-6">
        <button onClick={calcular} disabled={calculando} className="btn-primary flex items-center gap-1.5">
          {calculando ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />} Calcular
        </button>
      </div>

      {resultado && <Memorial resultado={resultado} />}
    </div>
  )
}

function Memorial({ resultado }) {
  const t = resultado.totais || {}
  return (
    <div className="card p-5 border-brand-200">
      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-1"><Check size={15} className="text-green-600" /> Memorial de cálculo</p>
      <p className="text-xs text-gray-400 mb-4">{resultado.metodologia}</p>

      {resultado.avisoFaltando && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4 text-xs text-amber-700 flex items-start gap-1.5">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" /> {resultado.avisoFaltando} ({resultado.faltando.join(', ')})
        </div>
      )}

      {resultado.rescisao ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Box label="Total bruto" valor={resultado.totais.bruto} />
            <Box label="Descontos (INSS)" valor={resultado.totais.descontos} cor="text-amber-600" />
            <Box label="Líquido a receber" valor={resultado.totais.valorFinal} cor="text-green-700" forte />
          </div>
          <div className="space-y-1 mb-4">
            {resultado.rescisao.verbas.map((v, i) => <div key={i} className="flex justify-between text-xs text-gray-500"><span>{v.descricao}</span><span>{fmtBRL(v.valor)}</span></div>)}
          </div>
        </>
      ) : resultado.liquidacao ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Box label="Verbas corrigidas" valor={resultado.liquidacao.bruto} />
            <Box label="FGTS (8%)" valor={resultado.liquidacao.fgts.valor} cor="text-brand-700" />
            <Box label="INSS" valor={resultado.liquidacao.inss.valor} cor="text-amber-600" />
            <Box label="Total devido" valor={resultado.totais.valorFinal} cor="text-green-700" forte />
          </div>
          <div className="space-y-1 mb-4">
            {resultado.liquidacao.itens.map((it, i) => <div key={i} className="flex justify-between text-xs text-gray-500"><span>{it.descricao} {it.incideFGTS ? '· FGTS' : ''}{it.incideINSS ? ' · INSS' : ''}</span><span>{fmtBRL(it.valorCorrigido)}</span></div>)}
          </div>
        </>
      ) : resultado.indice ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Box label={`Pelo ${resultado.indice.aplicado.indice}`} valor={resultado.indice.aplicado.valor} />
            <Box label={`Pelo ${resultado.indice.pretendido.indice}`} valor={resultado.indice.pretendido.valor} cor="text-green-700" />
            <Box label="Diferença" valor={resultado.indice.diferenca} cor="text-amber-600" forte />
          </div>
        </>
      ) : resultado.partilha ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Box label="Monte-mor" valor={resultado.partilha.totalBens} />
            {resultado.partilha.meacao.aplicada && <Box label="Meação (50%)" valor={resultado.partilha.meacao.valor} cor="text-brand-700" />}
            <Box label="Monte partível" valor={resultado.partilha.montePartivel} cor="text-gray-800" />
            <Box label={`Quinhão (${resultado.partilha.herdeiros}x)`} valor={resultado.partilha.quinhoes[0]?.valor} cor="text-green-700" forte />
          </div>
          <p className="text-xs text-gray-400 mb-4">Passivo (dívidas + despesas): {fmtBRL(resultado.partilha.passivo)} · líquido {fmtBRL(resultado.partilha.liquido)}</p>
        </>
      ) : resultado.aluguel ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <Box label="Aluguel original" valor={resultado.aluguel.aluguelOriginal} />
            <Box label="Aluguel corrigido" valor={resultado.aluguel.aluguelCorrigido} cor="text-green-700" forte />
            {resultado.aluguel.diferenca && <Box label="Diferença/mês" valor={resultado.aluguel.diferenca.diferencaMensal} cor="text-amber-600" />}
          </div>
          {resultado.aluguel.diferenca && <p className="text-xs text-gray-400 mb-4">Diferença acumulada em {resultado.aluguel.diferenca.meses} meses: {fmtBRL(resultado.aluguel.diferenca.totalDiferenca)}.</p>}
        </>
      ) : resultado.art916 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Box label="Valor em execução" valor={resultado.art916.valorExecucao} />
            <Box label="Entrada (30%)" valor={resultado.art916.entrada} cor="text-brand-700" />
            <Box label={`${resultado.art916.numParcelas}x de`} valor={resultado.art916.parcelaMensal} cor="text-amber-600" forte />
            <Box label="Custo total" valor={resultado.totais.valorFinal} cor="text-gray-800" />
          </div>
          <p className="text-xs text-gray-400 mb-4">Saldo parcelado {fmtBRL(resultado.art916.saldo)} · juros {resultado.art916.jurosMesPct}% a.m. · honorários {fmtBRL(resultado.art916.honorarios)}{resultado.art916.custas > 0 ? ` · custas ${fmtBRL(resultado.art916.custas)}` : ''}</p>
        </>
      ) : resultado.parcelaContratada != null ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Box label="Parcela contratada" valor={resultado.parcelaContratada} cor="text-red-600" />
            <Box label="Parcela revisada" valor={resultado.parcelaRevisada} cor="text-green-700" />
            <Box label="Diferença/mês" valor={resultado.diferencaMensal} cor="text-amber-600" />
            <Box label={resultado.parametros?.emDobro ? 'A restituir (em dobro)' : 'A restituir'} valor={resultado.totais.valorFinal} cor="text-green-700" forte />
          </div>
          <p className="text-xs text-gray-400 mb-4">Economia total no contrato: {fmtBRL(resultado.totais.economiaTotalContrato)} · Pago a maior: {fmtBRL(resultado.totais.pagoAMaior)}</p>
        </>
      ) : resultado.art523 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Box label="Débito atualizado" valor={resultado.art523.debitoAtualizado} />
            <Box label={`Multa ${resultado.art523.multaPct}%`} valor={resultado.art523.multa} cor="text-amber-600" />
            <Box label={`Honorários ${resultado.art523.honorariosPct}%`} valor={resultado.art523.honorarios} cor="text-amber-600" />
            <Box label="Total da execução" valor={t.valorFinal} cor="text-green-700" forte />
          </div>
          {resultado.art523.custas > 0 && <p className="text-xs text-gray-400 mb-4">Inclui custas de {fmtBRL(resultado.art523.custas)}.</p>}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Box label="Valor original" valor={t.valorOriginal} />
          <Box label="Correção + juros" valor={t.correcaoTotal} cor="text-amber-600" />
          <Box label="Valor atualizado" valor={t.valorFinal} cor="text-green-700" forte />
        </div>
      )}

      <div className="space-y-3">
        {(resultado.itens || []).map((it, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-800">{it.descricao}</p>
              <p className="text-sm font-semibold text-gray-800">{fmtBRL(it.valorFinal)}</p>
            </div>
            <p className="text-xs text-gray-400">
              Original {fmtBRL(it.valorOriginal)} · Correção {fmtBRL(it.fase1?.valorCorrigido)}
              {it.fase1?.jurosMora ? ` · Juros ${fmtBRL(it.fase1.jurosMora)}` : ''} · SELIC fator {it.fase2?.fator}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Box({ label, valor, cor = 'text-gray-800', forte }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className={`${forte ? 'text-lg' : 'text-sm'} font-semibold ${cor}`}>{fmtBRL(valor)}</p>
    </div>
  )
}
