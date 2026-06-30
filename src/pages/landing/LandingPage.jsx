import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Clock, FileText, Users, Calendar,
  Sparkles, Tag, ShieldCheck, Check, X,
  CreditCard, Mail, Unlock, Columns, BarChart3, UserCheck,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { assinaturaService } from '../../services/api.js'
import { FEATURES_POR_PLANO, PUBLICO_POR_PLANO } from '../../data/planos.js'
import { MockupKanbanPro, MockupPortal, MockupRelatorios } from './LandingMockupsPro.jsx'

/* ------------------------------------------------------------------ *
 *  Selo LexRun — substitui a logo PNG (sem dependência de imagem).
 * ------------------------------------------------------------------ */
function LexRunSeal({ size = 34, light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="11" fill="#0a1c3a" />
        <path d="M11 13l7 7-7 7" stroke="#d4af37" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 13l7 7-7 7" stroke="#d4af37" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
      </svg>
      <span className="font-display font-semibold tracking-tight" style={{ fontSize: Math.round(size * 0.6), color: light ? '#fff' : '#0a1c3a' }}>
        Lex<span style={{ color: light ? '#d4af37' : '#b3892f' }}>Run</span>
      </span>
    </span>
  )
}

/* ── Autuação ao vivo (assinatura visual do hero) ─────────────────── */
function AutuacaoAoVivo() {
  const [texto, setTexto] = useState('')
  const alvo = '0001847-23.2026.8.13.0247'
  const indexRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current += 1
      setTexto(alvo.slice(0, indexRef.current))
      if (indexRef.current >= alvo.length) clearInterval(interval)
    }, 70)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-gold-400/30 rounded-full px-4 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse flex-shrink-0" />
      <span className="text-[10.5px] text-white/50 uppercase tracking-[0.12em] font-semibold">Autuado agora</span>
      <span className="font-mono text-xs text-white tabular-nums">
        {texto}<span className="text-gold-400 animate-pulse">{texto.length < alvo.length ? '|' : ''}</span>
      </span>
    </div>
  )
}

const COMO_FUNCIONA = [
  { icon: CreditCard, titulo: 'Escolha seu plano', texto: 'Cadastre seu escritório e confirme o pagamento em um checkout seguro — leva menos de 2 minutos.' },
  { icon: Mail,       titulo: 'Receba seu acesso', texto: 'No instante em que o pagamento é confirmado, enviamos seu login e senha provisória por e-mail.' },
  { icon: Unlock,     titulo: 'Comece a usar',     texto: 'Entre, troque sua senha e já tenha processos, agenda e financeiro organizados no mesmo dia.' },
]

const FUNCIONALIDADES = [
  {
    icon: Columns,
    titulo: 'Kanban jurídico',
    texto: 'Acompanhe cada processo por fase real do trâmite — distribuição, instrução, aguardando decisão, encerrado — em vez de um quadro genérico de tarefas. Arraste para mover de fase.',
    mockup: MockupKanbanPro,
  },
  {
    icon: BarChart3,
    titulo: 'Relatórios que viram decisão',
    texto: 'Processos por status e por área, horas trabalhadas e honorários em carteira, com exportação em CSV e PDF. Pare de consolidar planilha na mão.',
    mockup: MockupRelatorios,
  },
  {
    icon: UserCheck,
    titulo: 'Portal do cliente',
    texto: 'Seu cliente acompanha o andamento do processo em linguagem simples, vê documentos e cobranças — sem te ligar a cada novidade. Você ganha tempo, ele ganha tranquilidade.',
    mockup: MockupPortal,
  },
]

const SEM_VS_COM = [
  { desafio: 'Acompanhar andamentos', sem: 'Consultar cada tribunal na mão, um por um', com: 'Sincronização automática pelo número CNJ' },
  { desafio: 'Controle de prazos', sem: 'Planilhas e post-its com risco de esquecer', com: 'Agenda integrada ao processo e ao cliente' },
  { desafio: 'Comunicação com o cliente', sem: 'WhatsApp fora de hora, ligação atrás de ligação', com: 'Portal onde o cliente acompanha sozinho' },
  { desafio: 'Cobrança de honorários', sem: 'Controle manual, inadimplência sem visão', com: 'Cobranças automáticas e inadimplência em tempo real' },
  { desafio: 'Documentos', sem: 'Modelos soltos no computador, copiar e colar', com: 'Geração por modelo e por IA, com sua marca' },
]

const RECURSOS_GRID = [
  { icon: Users,       titulo: 'Portal do cliente', texto: 'Seu cliente acompanha o processo sem te ligar a cada dois dias.' },
  { icon: Calendar,    titulo: 'Agenda integrada',  texto: 'Prazos e audiências vinculados direto ao processo e ao cliente.' },
  { icon: Sparkles,    titulo: 'IA de documentos',  texto: 'Gere petições, peças simples e procurações a partir de uma instrução em texto.' },
  { icon: Tag,         titulo: 'Etiquetas organizadas', texto: 'Marque clientes, processos e compromissos do seu jeito, sem funil fixo.' },
  { icon: FileText,    titulo: 'Documentos e modelos', texto: 'Gere PDFs com sua marca a partir de templates prontos.' },
  { icon: ShieldCheck, titulo: 'Multi-tenant seguro', texto: 'Cada escritório isolado logicamente — seus dados nunca se misturam com os de outro.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { data: planos } = useApi(() => assinaturaService.planos(), [])

  return (
    <div className="bg-paper text-brand-900 font-sans antialiased overflow-x-hidden">

      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-brand-900/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-[74px] flex items-center justify-between">
          <button onClick={() => navigate('/')} aria-label="LexRun">
            <LexRunSeal size={34} />
          </button>
          <nav className="hidden md:flex items-center gap-8 text-sm text-brand-900/65">
            <a href="#recursos" className="hover:text-brand-900 transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-brand-900 transition-colors">Planos</a>
            <a href="#faq" className="hover:text-brand-900 transition-colors">Perguntas frequentes</a>
          </nav>
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate('/login')} className="text-sm text-brand-900/65 hover:text-brand-900 transition-colors hidden sm:block">Entrar</button>
            <button onClick={() => navigate('/comecar')}
              className="bg-brand-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1.5">
              Começar agora <ArrowRight size={13} className="text-gold-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================== HERO (dark navy) ===================== */}
      <section className="relative overflow-hidden text-white"
        style={{ background: 'radial-gradient(120% 120% at 15% 8%, #12305c 0%, #0a1c3a 48%, #061224 100%)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-36 -right-16 w-[560px] h-[560px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,.18) 0%, rgba(212,175,55,0) 68%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <AutuacaoAoVivo />
            <h1 className="font-display font-semibold text-[38px] sm:text-[56px] leading-[1.06] mt-7 tracking-tight">
              A gestão do seu escritório, <span className="italic text-gold-300">conduzida</span> com a disciplina de um processo bem instruído.
            </h1>
            <p className="text-lg text-white/65 mt-6 max-w-xl leading-relaxed">
              Kanban jurídico, financeiro, portal do cliente e geração de documentos por IA — tudo isolado por escritório, num só sistema.
            </p>
            <div className="flex flex-wrap items-center gap-5 mt-9">
              <button onClick={() => navigate('/comecar')}
                className="px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#e0bd55,#c39a2e)', color: '#1a1304', boxShadow: '0 16px 34px -14px rgba(212,175,55,.6)' }}>
                Criar minha conta <ArrowRight size={15} />
              </button>
              <a href="#recursos" className="text-sm text-white/60 hover:text-white transition-colors">Ver como funciona ↓</a>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-3 mt-12 pt-8 border-t border-white/10">
              {[['7 dias', 'para reembolso total, sem perguntas'], ['Sem fidelidade', 'cancele quando quiser, pelo sistema'], ['LGPD', 'dados isolados por escritório']].map(([v, l]) => (
                <div key={v}>
                  <p className="font-display text-xl font-semibold text-white">{v}</p>
                  <p className="text-xs text-white/45 max-w-[160px]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup flutuante do hero (componente real) */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-5 rounded-[2rem] blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle at 70% 30%, rgba(212,175,55,.22), transparent 70%)' }} />
            <div className="relative rounded-2xl border border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] overflow-hidden bg-white">
              <MockupKanbanPro className="w-full h-auto block" />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== IA PEÇAS ===================== */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <div className="relative overflow-hidden rounded-[26px] px-8 py-12 md:px-12 md:py-14"
          style={{ background: 'radial-gradient(120% 140% at 85% 10%, #14315c 0%, #0a1c3a 60%)' }}>
          <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,.2) 0%, rgba(212,175,55,0) 70%)' }} />
          <div className="relative max-w-2xl">
            <span className="inline-block text-gold-300 text-xs font-semibold tracking-[0.14em] uppercase mb-3">Novo</span>
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-white mb-3 leading-tight">
              Precisa de uma peça? A gente redige para você.
            </h2>
            <p className="text-white/65 leading-relaxed mb-6">
              Solicite petições, pareceres e contratos personalizados, anexe os documentos do caso e
              receba a minuta pronta para revisar e protocolar — tudo dentro do LexRun.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-7">
              {['Petições', 'Pareceres', 'Contratos', 'Indicações'].map(t => (
                <span key={t} className="text-sm text-white/80 bg-white/10 rounded-full px-3.5 py-1.5">{t}</span>
              ))}
            </div>
            <button onClick={() => navigate('/comecar')}
              className="bg-white text-brand-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gold-100 transition-colors inline-flex items-center gap-2">
              Começar agora <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ===================== COMO FUNCIONA ===================== */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {COMO_FUNCIONA.map((passo, i) => (
            <div key={passo.titulo}>
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-9 h-9 rounded-full bg-brand-900 text-gold-400 flex items-center justify-center flex-shrink-0">
                  <passo.icon size={15} />
                </div>
                <span className="font-mono text-xs text-brand-900/35">{`0${i + 1}`}</span>
              </div>
              <p className="font-semibold text-[15px] mb-1.5">{passo.titulo}</p>
              <p className="text-sm text-brand-900/55 leading-relaxed">{passo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FUNCIONALIDADES ===================== */}
      <section id="recursos" className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-24 md:space-y-28">
        {FUNCIONALIDADES.map((f, i) => {
          const Mockup = f.mockup
          const invertido = i % 2 === 1
          return (
            <div key={f.titulo} className={`flex flex-col ${invertido ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}>
              <div className="flex-1">
                <div className="w-11 h-11 rounded-xl bg-brand-900 flex items-center justify-center mb-5">
                  <f.icon size={19} className="text-gold-400" />
                </div>
                <h3 className="font-display font-semibold text-2xl md:text-3xl mb-3">{f.titulo}</h3>
                <p className="text-brand-900/60 leading-relaxed max-w-md">{f.texto}</p>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-brand-900/[0.07] shadow-[0_28px_56px_-22px_rgba(15,30,48,0.2)] overflow-hidden">
                  <Mockup className="w-full h-auto block" />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ===================== RECURSOS GRID ===================== */}
      <section className="max-w-6xl mx-auto px-6 py-8 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RECURSOS_GRID.map(r => (
            <div key={r.titulo} className="bg-white rounded-2xl border border-brand-900/[0.06] p-6">
              <r.icon size={18} className="text-accent-500 mb-4" />
              <p className="font-semibold text-[15px] mb-1.5">{r.titulo}</p>
              <p className="text-sm text-brand-900/55 leading-relaxed">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SEM VS COM (dark) ===================== */}
      <section className="py-20 md:py-28"
        style={{ background: 'radial-gradient(120% 120% at 80% 0%, #12305c 0%, #0a1c3a 55%, #061224 100%)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12 max-w-xl mx-auto">
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-white mb-3">
              O dia a dia do escritório, antes e depois
            </h2>
            <p className="text-white/55">
              O que muda quando a gestão para de depender de planilha, memória e WhatsApp.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs md:text-sm font-semibold">
              <div className="px-4 md:px-6 py-4 text-white/50">Desafio</div>
              <div className="px-4 md:px-6 py-4 text-white/50 border-l border-white/10">Sem o LexRun</div>
              <div className="px-4 md:px-6 py-4 text-gold-300 border-l border-white/10 bg-white/[0.03]">Com o LexRun</div>
            </div>
            {SEM_VS_COM.map((linha, i) => (
              <div key={i} className="grid grid-cols-3 text-xs md:text-sm border-t border-white/[0.07]">
                <div className="px-4 md:px-6 py-4 text-white font-medium">{linha.desafio}</div>
                <div className="px-4 md:px-6 py-4 text-white/55 border-l border-white/10 flex items-start gap-2">
                  <X size={14} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                  <span>{linha.sem}</span>
                </div>
                <div className="px-4 md:px-6 py-4 text-white/85 border-l border-white/10 bg-white/[0.03] flex items-start gap-2">
                  <Check size={14} className="text-accent-400 flex-shrink-0 mt-0.5" />
                  <span>{linha.com}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PLANOS ===================== */}
      <section id="planos" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <h2 className="font-display font-semibold text-3xl md:text-4xl mb-3">Um plano para cada fase da banca</h2>
          <p className="text-brand-900/60">Cancele quando quiser. Sem multa, sem letra miúda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
          {(planos || [{ chave: 'basico', nome: 'Básico', valor: 97 }, { chave: 'professional', nome: 'Professional', valor: 197 }, { chave: 'banca', nome: 'Banca', valor: 397 }]).map(plano => {
            const destaque = plano.chave === 'professional'
            return (
              <div key={plano.chave}
                className={`rounded-2xl p-7 relative ${destaque ? 'text-white shadow-[0_30px_60px_-24px_rgba(10,28,58,0.55)]' : 'bg-white border border-brand-900/[0.07]'}`}
                style={destaque ? { background: 'linear-gradient(160deg,#0d2241,#0a1c3a)', border: '1px solid rgba(212,175,55,.4)' } : undefined}>
                {destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-brand-900 text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Mais escolhido
                  </span>
                )}
                <p className={`text-sm font-semibold mb-1 ${destaque ? 'text-white' : 'text-brand-900'}`}>{plano.nome}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`font-display text-4xl font-semibold ${destaque ? 'text-white' : 'text-brand-900'}`}>R${plano.valor}</span>
                  <span className={`text-sm ${destaque ? 'text-white/50' : 'text-brand-900/40'}`}>/mês</span>
                </div>
                <p className={`text-xs mb-5 ${destaque ? 'text-white/55' : 'text-brand-900/45'}`}>{PUBLICO_POR_PLANO[plano.chave]}</p>
                <ul className="space-y-2 mb-6">
                  {(FEATURES_POR_PLANO[plano.chave] || []).map(f => (
                    <li key={f.label}
                      className={`flex items-center gap-2 text-xs ${
                        f.ok
                          ? (destaque ? 'text-white/85' : 'text-brand-900/75')
                          : f.emBreve
                          ? (destaque ? 'text-white/45' : 'text-brand-900/40')
                          : (destaque ? 'text-white/30' : 'text-brand-900/25')
                      }`}>
                      {f.emBreve
                        ? <Clock size={12} className={`flex-shrink-0 ${destaque ? 'text-gold-300' : 'text-amber-400'}`} />
                        : f.ok
                        ? <Check size={12} className={`flex-shrink-0 ${destaque ? 'text-gold-400' : 'text-accent-600'}`} />
                        : <X size={12} className={`flex-shrink-0 ${destaque ? 'text-white/25' : 'text-brand-900/15'}`} />
                      }
                      <span>{f.label}{f.emBreve && <span className={`ml-1 ${destaque ? 'text-gold-300' : 'text-amber-500'}`}>(em breve)</span>}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(`/comecar?plano=${plano.chave}`)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    destaque ? '' : 'bg-brand-900 text-white hover:bg-brand-700'
                  }`}
                  style={destaque ? { background: 'linear-gradient(135deg,#e0bd55,#c39a2e)', color: '#1a1304' } : undefined}>
                  Assinar {plano.nome} <ArrowRight size={13} />
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-center text-sm text-brand-900/45 mt-8">
          Todos os planos incluem atualizações e suporte. Cancele quando quiser, sem multa.
        </p>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h2 className="font-display font-semibold text-3xl mb-10 text-center">Perguntas frequentes</h2>
        <div className="space-y-7">
          {[
            ['Como funciona a sincronização com os tribunais?', 'Você informa o número CNJ do processo e o LexRun busca as movimentações na base pública nacional do CNJ (DataJud), mantendo o andamento atualizado automaticamente — sem você consultar cada tribunal na mão.'],
            ['Preciso de cartão de crédito para assinar?', 'Sim — a assinatura é confirmada no momento do cadastro via Checkout seguro da Stripe, com cobrança recorrente mensal.'],
            ['Posso cancelar quando quiser?', 'Sim. Acesse Configurações > Assinatura e gerencie seu plano, forma de pagamento ou cancelamento direto pelo portal da Stripe. Sem multa, sem fidelidade.'],
            ['Como funciona o portal do cliente?', 'Você ativa o portal de um cliente e ele passa a acompanhar o andamento do próprio processo em linguagem simples, além de ver documentos e cobranças — reduzindo as ligações e mensagens fora de hora.'],
            ['Meus dados ficam seguros?', 'Sim. Arquitetura multi-tenant com isolamento lógico — os dados do seu escritório nunca se misturam com os de outro. Em conformidade com a LGPD.'],
            ['O que recebo por e-mail depois de assinar?', 'Assim que o pagamento é confirmado, você recebe um e-mail com seu login e uma senha provisória para o primeiro acesso.'],
            ['Tenho cupom de desconto, onde aplico?', 'No Checkout, antes de confirmar o pagamento, há um campo para inserir o código promocional.'],
          ].map(([p, r]) => (
            <div key={p} className="border-b border-brand-900/[0.07] pb-6">
              <p className="font-semibold mb-1.5">{p}</p>
              <p className="text-sm text-brand-900/55 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-[28px] px-8 py-16 md:py-20 text-center"
          style={{ background: 'radial-gradient(120% 140% at 50% 0%, #14315c 0%, #0a1c3a 60%)' }}>
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[300px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,.16) 0%, rgba(212,175,55,0) 70%)' }} />
          <h2 className="relative font-display font-semibold text-3xl md:text-4xl text-white mb-6 leading-snug">
            Sua próxima audiência já tem prazo. <br className="hidden md:block" />Seu sistema também devia ter.
          </h2>
          <button onClick={() => navigate('/comecar')}
            className="relative px-7 py-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#e0bd55,#c39a2e)', color: '#1a1304', boxShadow: '0 16px 34px -14px rgba(212,175,55,.6)' }}>
            Criar minha conta agora <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-brand-900/[0.07] bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3"><LexRunSeal size={30} /></div>
              <p className="text-xs text-brand-900/50 leading-relaxed max-w-[210px]">
                Gestão jurídica completa para escritórios de advocacia, do início ao encerramento do processo.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-3">Produto</p>
              <ul className="space-y-2 text-sm text-brand-900/55">
                <li><a href="#recursos" className="hover:text-brand-900">Recursos</a></li>
                <li><a href="#planos" className="hover:text-brand-900">Planos</a></li>
                <li><a href="#faq" className="hover:text-brand-900">Perguntas frequentes</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-3">Acesso</p>
              <ul className="space-y-2 text-sm text-brand-900/55">
                <li><button onClick={() => navigate('/login')} className="hover:text-brand-900">Entrar</button></li>
                <li><button onClick={() => navigate('/comecar')} className="hover:text-brand-900">Criar conta</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-brand-900/55">
                <li><a href="/termos-de-uso" className="hover:text-brand-900">Termos de Uso</a></li>
                <li><a href="/politica-de-privacidade" className="hover:text-brand-900">Privacidade</a></li>
                <li><a href="/politica-de-reembolso" className="hover:text-brand-900">Reembolso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-900/[0.07] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-brand-900/40">© {new Date().getFullYear()} LexRun. Todos os direitos reservados.</p>
            <p className="text-xs text-brand-900/40">contato@lexrun.com.br</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
