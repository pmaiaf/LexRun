import { useEffect } from 'react'
import { Check, X, Zap, Loader2, ExternalLink, AlertTriangle, Clock, Undo2 } from 'lucide-react'
import { useApi, useAction } from '../hooks/useApi.js'
import { assinaturaService, iaDocumentosService } from '../services/api.js'
import { useToast, LoadingScreen, ErrorBlock } from '../components/ui/index.jsx'
import { FEATURES_POR_PLANO, PUBLICO_POR_PLANO } from '../data/planos.js'

const STATUS_LABEL = {
  ativo:        { label: 'Assinatura ativa',         className: 'bg-green-50 text-green-700 border-green-100' },
  trial:        { label: 'Período de teste',          className: 'bg-blue-50 text-blue-700 border-blue-100'   },
  inadimplente: { label: 'Pagamento pendente',         className: 'bg-red-50 text-red-700 border-red-100'     },
  cancelado:    { label: 'Assinatura cancelada',       className: 'bg-gray-50 text-gray-600 border-gray-100'   },
  incompleta:   { label: 'Pagamento não concluído',    className: 'bg-amber-50 text-amber-700 border-amber-100'},
  pausada:      { label: 'Assinatura pausada',         className: 'bg-gray-50 text-gray-600 border-gray-100'   },
}

export default function PlanosPage() {
  const toast = useToast()
  const { data: planos,   loading: l1, error: e1, refetch: r1 } = useApi(() => assinaturaService.planos(), [])
  const { data: status,   loading: l2, refetch: r2 }            = useApi(() => assinaturaService.status(), [])
  const { data: usoIA }                                          = useApi(() => iaDocumentosService.status(), [])
  const { data: elegibilidade, refetch: r3 } = useApi(() => assinaturaService.elegibilidadeReembolso(), [])
  const { execute: execCheckout, loading: assinando } = useAction()
  const { execute: execPortal,   loading: abrindoPortal } = useAction()
  const { execute: execReembolso, loading: solicitandoReembolso } = useAction()

  // Trata o retorno do Checkout (?assinatura=sucesso / =cancelado)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('assinatura') === 'sucesso') {
      toast.success('Assinatura confirmada! Pode levar alguns segundos para atualizar.')
      setTimeout(() => r2(), 2000)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('assinatura') === 'cancelado') {
      toast.info('Checkout cancelado — nenhuma cobrança foi feita.')
      window.history.replaceState({}, '', window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAssinar(planoChave) {
    await execCheckout(() => assinaturaService.criarCheckout(planoChave), {
      onSuccess: (res) => { window.location.href = res.checkout_url },
      onError: msg => toast.error(msg),
    })
  }

  async function handleGerenciar() {
    await execPortal(() => assinaturaService.criarPortal(), {
      onSuccess: (res) => { window.location.href = res.portal_url },
      onError: msg => toast.error(msg),
    })
  }

  async function handleSolicitarReembolso() {
    await execReembolso(() => assinaturaService.solicitarReembolso(), {
      onSuccess: (res) => { toast.success(res.mensagem); r3() },
      onError: msg => toast.error(msg),
    })
  }

  if (l1 && !planos) return <LoadingScreen />
  if (e1)            return <ErrorBlock message={e1} onRetry={r1} />

  const planoAtivo = status?.plano && (status.status === 'ativo' || status.status === 'trial') ? status.plano : null
  const statusInfo = status?.status ? STATUS_LABEL[status.status] : null
  const pertoDoLimiteIA = usoIA?.limite_mensal && !usoIA?.tem_chave_propria && usoIA.geracoes_usadas_mes >= usoIA.limite_mensal * 0.8

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Planos & Assinatura</h1>
        <p className="text-sm text-gray-500 mt-1">Escolha o plano ideal para o seu escritório. Cancele quando quiser.</p>
      </div>

      {pertoDoLimiteIA && (
        <div className="max-w-2xl mx-auto mb-4 flex items-center gap-3 border border-amber-100 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700">
          <Zap size={15} className="flex-shrink-0"/>
          <span>
            Você já usou {usoIA.geracoes_usadas_mes} de {usoIA.limite_mensal} gerações de IA este mês.
            Um plano superior libera mais gerações sem custo extra.
          </span>
        </div>
      )}

      {statusInfo && (
        <div className={`max-w-2xl mx-auto mb-6 flex items-center justify-between gap-3 border rounded-xl px-4 py-3 text-sm ${statusInfo.className}`}>
          <div className="flex items-center gap-2">
            {status.status === 'inadimplente' && <AlertTriangle size={15}/>}
            <span>{statusInfo.label}{status.proximo_venc ? ` · próxima cobrança em ${new Date(status.proximo_venc).toLocaleDateString('pt-BR')}` : ''}</span>
          </div>
          {status.stripe_subscription_id && (
            <button onClick={handleGerenciar} disabled={abrindoPortal}
              className="flex items-center gap-1 text-xs font-medium underline hover:no-underline flex-shrink-0">
              {abrindoPortal ? <Loader2 size={12} className="animate-spin"/> : <ExternalLink size={12}/>}
              Gerenciar assinatura
            </button>
          )}
        </div>
      )}

      {elegibilidade && elegibilidade.motivo !== 'Nenhuma assinatura encontrada para este escritório.' && (
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
          <div className="flex items-center gap-2 min-w-0">
            <Undo2 size={15} className="flex-shrink-0 text-gray-400"/>
            <span className="truncate">
              {elegibilidade.solicitacao_pendente
                ? 'Solicitação de reembolso enviada — confirme pelo link no seu e-mail.'
                : elegibilidade.elegivel
                  ? `Direito de arrependimento: você ainda pode solicitar reembolso integral (restam ${elegibilidade.dias_restantes} dia${elegibilidade.dias_restantes === 1 ? '' : 's'}).`
                  : 'Direito de arrependimento (7 dias) indisponível para esta assinatura.'}
            </span>
          </div>
          <span title={!elegibilidade.elegivel ? elegibilidade.motivo : (elegibilidade.solicitacao_pendente ? 'Verifique seu e-mail para confirmar.' : '')}>
            <button
              onClick={handleSolicitarReembolso}
              disabled={!elegibilidade.elegivel || elegibilidade.solicitacao_pendente || solicitandoReembolso}
              className="flex items-center gap-1 text-xs font-medium underline hover:no-underline flex-shrink-0 disabled:no-underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:opacity-100"
            >
              {solicitandoReembolso && <Loader2 size={12} className="animate-spin"/>}
              Solicitar reembolso
            </button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {(planos || []).map(plano => {
          const destaque = plano.chave === 'professional'
          const ehAtual = planoAtivo === plano.chave
          return (
            <div key={plano.chave} className={`card p-6 relative ${destaque ? 'border-2 border-brand-700' : ''}`}>
              {destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-800 text-white text-[10px] font-medium px-3 py-0.5 rounded-full whitespace-nowrap">
                  Mais popular
                </div>
              )}

              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-900 mb-1">{plano.nome}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  {l2 ? <div className="h-9 w-20 bg-gray-100 rounded animate-pulse"/> : (
                    <>
                      <span className="text-3xl font-semibold text-gray-900">R${plano.valor}</span>
                      <span className="text-sm text-gray-400">/mês</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400">{PUBLICO_POR_PLANO[plano.chave]}</p>
                {plano.indisponivel && (
                  <p className="text-[10px] text-amber-600 mt-1.5">Preço de exemplo — aguardando configuração final.</p>
                )}
              </div>

              <div className="space-y-2.5 mb-6">
                {(FEATURES_POR_PLANO[plano.chave] || []).map(f => (
                  <div key={f.label} className={`flex items-center gap-2 text-xs ${f.ok ? 'text-gray-700' : f.emBreve ? 'text-gray-400' : 'text-gray-300'}`}>
                    {f.emBreve
                      ? <Clock size={13} className="text-amber-400 flex-shrink-0" />
                      : f.ok
                      ? <Check size={13} className="text-green-600 flex-shrink-0" />
                      : <X     size={13} className="text-gray-200 flex-shrink-0" />
                    }
                    {f.label}
                    {f.emBreve && <span className="text-[10px] text-amber-500 font-medium">(em breve)</span>}
                  </div>
                ))}
              </div>

              <button
                onClick={() => !ehAtual && handleAssinar(plano.chave)}
                disabled={ehAtual || assinando || plano.indisponivel}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  ehAtual
                    ? 'bg-green-50 text-green-700 cursor-default'
                    : destaque
                      ? 'bg-brand-800 text-white hover:bg-brand-900 disabled:opacity-50'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                {assinando && <Loader2 size={13} className="animate-spin"/>}
                {ehAtual ? 'Plano atual ✓' : `Assinar ${plano.nome}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ / notes */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Zap size={15} className="text-amber-500" /> Perguntas frequentes
          </p>
          <div className="space-y-4">
            {[
              ['Posso trocar de plano a qualquer momento?', 'Sim. Use "Gerenciar assinatura" para trocar de plano, atualizar o cartão ou cancelar — tudo pelo portal seguro da Stripe.'],
              ['Como funciona o pagamento?', 'Cartão de crédito, cobrança recorrente mensal. Você recebe a fatura por e-mail automaticamente.'],
              ['Os dados ficam seguros?', 'Sim. Arquitetura multi-tenant com isolamento lógico. Seus dados jamais se misturam com os de outro escritório.'],
              ['Tenho cupom de desconto, onde aplico?', 'No Checkout, há um campo para inserir o código promocional antes de confirmar o pagamento.'],
            ].map(([p, r]) => (
              <div key={p}>
                <p className="text-xs font-medium text-gray-800 mb-1">{p}</p>
                <p className="text-xs text-gray-500">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
