import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { assinaturaService, cadastroService } from '../../services/api.js'

/* ------------------------------------------------------------------ *
 *  SignupPage — visual alinhado ao LoginPage (hero navy + cards
 *  dourados à esquerda, formulário à direita). Toda a lógica original
 *  foi mantida: etapa/form/avancar/handleAssinar, aceitouTermos, erro,
 *  enviando, planos (useApi) e o useEffect do parâmetro ?plano.
 * ------------------------------------------------------------------ */

const NAVY = '#0a1c3a'
const GOLD = '#d4af37'
const GOLD_DEEP = '#c39a2e'

const PUBLICO_POR_PLANO = {
  basico: 'Advogados autônomos e recém-formados',
  professional: 'Pequenos e médios escritórios',
  banca: 'Bancas e escritórios consolidados',
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { data: planos } = useApi(() => assinaturaService.planos(), [])

  const [etapa, setEtapa] = useState(1)
  const [form, setForm] = useState({ nomeEscritorio: '', nome: '', email: '', plano: '' })
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const planoUrl = params.get('plano')
    if (planoUrl) set('plano', planoUrl)
  }, [])

  function avancar(e) {
    e.preventDefault()
    setErro('')
    if (!form.nomeEscritorio.trim() || !form.nome.trim() || !form.email.trim()) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    setEtapa(2)
  }

  async function handleAssinar(planoChave) {
    if (!aceitouTermos) {
      setErro('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.')
      return
    }
    set('plano', planoChave)
    setErro('')
    setEnviando(true)
    try {
      const res = await cadastroService.criar({ ...form, plano: planoChave })
      window.location.href = res.checkout_url
    } catch (err) {
      setErro(err.message || 'Não foi possível iniciar o cadastro.')
      setEnviando(false)
    }
  }

  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#3c4a66', marginBottom: 7 }

  return (
    <div className="min-h-screen flex">
      {/* keyframes da animação dos cards (injetado uma vez) */}
      <style>{`
        @keyframes lxFloatA { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-13px) } }
        @keyframes lxFloatB { 0%,100% { transform: translateY(0) } 50% { transform: translateY(11px) } }
        @keyframes lxFloatC { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
      `}</style>

      {/* ============== LEFT — HERO NAVY + CARDS DOURADOS ============== */}
      <div
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: `radial-gradient(120% 120% at 18% 12%, #12305c 0%, ${NAVY} 46%, #061224 100%)` }}
      >
        {/* texturas / brilhos */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '26px 26px', opacity: .5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -120, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,.20) 0%, rgba(212,175,55,0) 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -160, left: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(40,90,170,.30) 0%, rgba(40,90,170,0) 70%)', pointerEvents: 'none' }} />

        {/* Logo no topo — selo LexRun (dourado) */}
        <button onClick={() => navigate('/')} className="z-10 flex items-center" style={{ gap: 13 }}>
          <svg width="42" height="42" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="11" fill={NAVY} />
            <rect x="0.6" y="0.6" width="38.8" height="38.8" rx="10.4" stroke="rgba(212,175,55,.45)" strokeWidth="1.2" />
            <path d="M11 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
          </svg>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 23, letterSpacing: '-0.01em', color: '#fff' }}>Lex<span style={{ color: GOLD }}>Run</span></span>
        </button>

        {/* Conteúdo central: texto + cards (duas colunas, sem sobreposição) */}
        <div className="z-10 relative flex items-center gap-10 flex-wrap my-2">
          {/* texto */}
          <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: 480 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(212,175,55,.35)', background: 'rgba(212,175,55,.08)', color: '#e7c976', fontSize: 12.5, fontWeight: 500, letterSpacing: '.02em', marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
              Automação jurídica de ponta a ponta
            </div>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(34px,3.4vw,52px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px' }}>
              Comece hoje.<br />Seu escritório no <span style={{ color: GOLD }}>piloto automático.</span>
            </h1>
            <p style={{ fontSize: 'clamp(15px,1.1vw,17px)', lineHeight: 1.6, color: '#aebfda', margin: 0 }}>
              Gestão de prazos, processos e documentos em uma única plataforma. Mais velocidade, menos trabalho repetitivo — para você focar no que importa.
            </p>
          </div>

          {/* cards */}
          <div style={{ flex: '0 0 286px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* card 1 — petição protocolada */}
            <div style={{ alignSelf: 'flex-end', width: 268, padding: 18, borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 26px 60px -22px rgba(0,0,0,.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'lxFloatA 7s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ flex: 'none', width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(140deg,#1f8a5b,#13694a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px -6px rgba(31,138,91,.7)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>Petição protocolada</div>
                  <div style={{ fontSize: 12, color: '#9fb2d4', marginTop: 3 }}>Processo nº 0042118-22 · há 2 min</div>
                </div>
              </div>
            </div>

            {/* card 2 — 73% mais rápido */}
            <div style={{ alignSelf: 'flex-start', marginLeft: 6, width: 200, padding: 18, borderRadius: 18, background: 'rgba(212,175,55,.13)', border: '1px solid rgba(212,175,55,.34)', boxShadow: '0 26px 60px -22px rgba(0,0,0,.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'lxFloatB 8s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(212,175,55,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#f0d27a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0d27a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
              </div>
              <div className="font-display" style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1 }}>73%</div>
              <div style={{ fontSize: 12.5, color: '#e7c976', marginTop: 5, fontWeight: 500 }}>mais rápido por petição</div>
            </div>

            {/* card 3 — prazos sob controle */}
            <div style={{ alignSelf: 'flex-end', width: 258, padding: 18, borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 26px 60px -22px rgba(0,0,0,.6)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: 'lxFloatC 6.4s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                <div style={{ flex: 'none', width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>Prazos sob controle</div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.1)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '0 28% 0 0', borderRadius: 999, background: `linear-gradient(90deg,${GOLD},#f0d27a)` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 11.5, color: '#9fb2d4' }}>
                <span>18 monitorados</span><span style={{ color: '#f0d27a' }}>0 vencidos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Frase no rodapé */}
        <div className="z-10 relative flex items-center gap-2.5" style={{ color: '#7e92b8', fontSize: 13 }}>
          <span style={{ width: 26, height: 1, background: 'rgba(212,175,55,.5)' }} />
          A gestão do seu escritório em um só lugar.
        </div>
      </div>

      {/* ===================== RIGHT — FORMULÁRIO (estilo LexRun) ===================== */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#f5f7fb' }}>
        <div className="w-full" style={{ maxWidth: 420 }}>

          {/* selo LexRun + indicador de etapa */}
          <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
            <button onClick={() => navigate('/')} className="flex items-center" style={{ gap: 11 }}>
              <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="11" fill={NAVY} />
                <path d="M11 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
              </svg>
              <span className="font-display" style={{ fontWeight: 600, fontSize: 21, letterSpacing: '-0.01em', color: NAVY }}>Lex<span style={{ color: GOLD_DEEP }}>Run</span></span>
            </button>
            <div className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
              <span style={{ fontWeight: etapa === 1 ? 600 : 500, color: etapa === 1 ? NAVY : '#9aa6bf' }}>1. Seus dados</span>
              <span style={{ color: '#c3ccdd' }}>→</span>
              <span style={{ fontWeight: etapa === 2 ? 600 : 500, color: etapa === 2 ? NAVY : '#9aa6bf' }}>2. Plano</span>
            </div>
          </div>

          {etapa === 1 ? (
            <form onSubmit={avancar}>
              <h1 className="font-display" style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: NAVY, margin: '0 0 8px' }}>Crie sua conta</h1>
              <p style={{ fontSize: 14.5, color: '#6b7895', margin: '0 0 28px' }}>Comece a usar o LexRun no seu escritório.</p>

              {erro && <p className="text-[15px] text-red-600 bg-red-50 px-4 py-2.5 rounded-lg mb-4">{erro}</p>}

              <div className="space-y-4">
                <div>
                  <label className="block" style={labelStyle}>Nome do escritório *</label>
                  <input className="input" value={form.nomeEscritorio}
                    onChange={e => set('nomeEscritorio', e.target.value)}
                    placeholder="Ex: Andrade Advocacia" required />
                </div>
                <div>
                  <label className="block" style={labelStyle}>Seu nome completo *</label>
                  <input className="input" value={form.nome}
                    onChange={e => set('nome', e.target.value)} placeholder="Ex: Marcos Andrade" required />
                </div>
                <div>
                  <label className="block" style={labelStyle}>E-mail *</label>
                  <input type="email" className="input" value={form.email}
                    onChange={e => set('email', e.target.value)} placeholder="voce@escritorio.adv.br" required />
                  <p className="mt-1.5" style={{ fontSize: 11.5, lineHeight: 1.5, color: '#9aa6bf' }}>Seus dados de acesso serão enviados para este e-mail após a confirmação do pagamento.</p>
                </div>
              </div>

              <button type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-transform mt-6"
                style={{ padding: '14px', background: 'linear-gradient(135deg,#13305c,#0a1c3a)', color: '#fff', boxShadow: '0 14px 30px -14px rgba(10,28,58,.8)' }}>
                Continuar para o plano <ArrowRight size={15} />
              </button>

              <p className="text-center mt-7" style={{ fontSize: 13.5, color: '#6b7895' }}>
                Já tem conta?{' '}
                <button type="button" onClick={() => navigate('/login')} className="hover:underline font-semibold" style={{ color: NAVY }}>Entrar</button>
              </p>
            </form>
          ) : (
            <div>
              <button onClick={() => setEtapa(1)} className="flex items-center gap-1.5 hover:opacity-80 mb-5" style={{ fontSize: 13, color: '#6b7895' }}>
                <ArrowLeft size={13} /> Voltar
              </button>
              <h1 className="font-display" style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: NAVY, margin: '0 0 8px' }}>Escolha seu plano</h1>
              <p style={{ fontSize: 14.5, color: '#6b7895', margin: '0 0 24px' }}>Você será redirecionado para um checkout seguro da Stripe.</p>

              {erro && <p className="text-[15px] text-red-600 bg-red-50 px-4 py-2.5 rounded-lg mb-4">{erro}</p>}

              <div className="space-y-3">
                {(planos || [{ chave: 'basico', nome: 'Básico', valor: 97 }, { chave: 'professional', nome: 'Professional', valor: 197 }, { chave: 'banca', nome: 'Banca', valor: 397 }]).map(plano => {
                  const selecionado = form.plano === plano.chave
                  return (
                    <button key={plano.chave} type="button" disabled={enviando}
                      onClick={() => handleAssinar(plano.chave)}
                      className="w-full text-left rounded-xl border transition-all flex items-center justify-between gap-3 disabled:opacity-70"
                      style={{
                        padding: 16,
                        borderColor: selecionado ? GOLD : '#e4e8f0',
                        background: selecionado ? 'rgba(212,175,55,.08)' : '#fff',
                        boxShadow: selecionado ? '0 10px 26px -18px rgba(10,28,58,.4)' : 'none',
                      }}>
                      <div>
                        <p style={{ fontSize: 14.5, fontWeight: 600, color: NAVY }}>{plano.nome}</p>
                        <p style={{ fontSize: 12.5, color: '#8a97b0', marginTop: 2 }}>{PUBLICO_POR_PLANO[plano.chave]}</p>
                      </div>
                      <div className="text-right flex items-center gap-2.5 flex-shrink-0">
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>R${plano.valor}</p>
                          <p style={{ fontSize: 10.5, color: '#9aa6bf' }}>/mês</p>
                        </div>
                        {enviando && selecionado
                          ? <Loader2 size={17} className="animate-spin" style={{ color: GOLD_DEEP }} />
                          : selecionado ? <Check size={17} style={{ color: GOLD_DEEP }} /> : null
                        }
                      </div>
                    </button>
                  )
                })}
              </div>

              <label className="flex items-start gap-2.5 mt-6 cursor-pointer">
                <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded" style={{ accentColor: NAVY, borderColor: '#c3ccdd' }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.6, color: '#6b7895' }}>
                  Li e aceito os{' '}
                  <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="hover:underline font-medium" style={{ color: GOLD_DEEP }}>Termos de Uso</a>{' '}
                  e a{' '}
                  <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="hover:underline font-medium" style={{ color: GOLD_DEEP }}>Política de Privacidade</a>.
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
