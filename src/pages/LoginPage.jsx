import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Spinner } from '../components/ui/index.jsx'

/* ------------------------------------------------------------------ *
 *  LoginPage — visual modernizado (hero navy + cards dourados).
 *  Toda a lógica original foi mantida: useAuth/login, navigate,
 *  showSenha, erro, loading, Spinner e as classes .input/.btn.
 * ------------------------------------------------------------------ */

const NAVY = '#0a1c3a'
const GOLD = '#d4af37'
const GOLD_DEEP = '#c39a2e'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form,      setForm]      = useState({ email: '', senha: '' })
  const [showSenha, setShowSenha] = useState(false)
  const [lembrar,   setLembrar]   = useState(true)
  const [erro,      setErro]      = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      await login(form.email, form.senha)
      navigate('/dashboard')
    } catch (err) {
      setErro(err.message || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

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
        <div className="z-10 flex items-center" style={{ gap: 13 }}>
          <svg width="42" height="42" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="11" fill={NAVY} />
            <rect x="0.6" y="0.6" width="38.8" height="38.8" rx="10.4" stroke="rgba(212,175,55,.45)" strokeWidth="1.2" />
            <path d="M11 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
          </svg>
          <span className="font-display" style={{ fontWeight: 600, fontSize: 23, letterSpacing: '-0.01em', color: '#fff' }}>Lex<span style={{ color: GOLD }}>Run</span></span>
        </div>

        {/* Conteúdo central: texto + cards (duas colunas, sem sobreposição) */}
        <div className="z-10 relative flex items-center gap-10 flex-wrap my-2">
          {/* texto */}
          <div style={{ flex: '1 1 360px', minWidth: 0, maxWidth: 480 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(212,175,55,.35)', background: 'rgba(212,175,55,.08)', color: '#e7c976', fontSize: 12.5, fontWeight: 500, letterSpacing: '.02em', marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
              Automação jurídica de ponta a ponta
            </div>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(34px,3.4vw,52px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px' }}>
              O seu escritório,<br />no <span style={{ color: GOLD }}>piloto automático.</span>
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
        <div className="w-full" style={{ maxWidth: 392 }}>

          {/* selo LexRun */}
          <div className="flex items-center" style={{ gap: 11, marginBottom: 36 }}>
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="11" fill={NAVY} />
              <path d="M11 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 13l7 7-7 7" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
            </svg>
            <span className="font-display" style={{ fontWeight: 600, fontSize: 21, letterSpacing: '-0.01em', color: NAVY }}>Lex<span style={{ color: GOLD_DEEP }}>Run</span></span>
          </div>

          <h1 className="font-display" style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', color: NAVY, margin: '0 0 8px' }}>Bem-vindo de volta</h1>
          <p style={{ fontSize: 14.5, color: '#6b7895', margin: '0 0 30px' }}>Acesse a sua conta para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* email */}
            <div>
              <label className="block" style={{ fontSize: 12.5, fontWeight: 600, color: '#3c4a66', marginBottom: 7 }}>E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9aa6bf' }} />
                <input type="email" className="input" style={{ paddingLeft: 42 }} value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="voce@escritorio.com.br" required />
              </div>
            </div>

            {/* senha */}
            <div>
              <label className="block" style={{ fontSize: 12.5, fontWeight: 600, color: '#3c4a66', marginBottom: 7 }}>Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9aa6bf' }} />
                <input type={showSenha ? 'text' : 'password'} className="input" style={{ paddingLeft: 42, paddingRight: 42 }}
                  value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* manter conectado + esqueci a senha */}
            <div className="flex items-center justify-between">
              <label className="flex items-center select-none cursor-pointer" style={{ gap: 9, fontSize: 13, color: '#52607c' }}>
                <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: NAVY }} />
                Manter conectado
              </label>
              <button type="button" onClick={() => navigate('/esqueci-senha')}
                className="hover:underline" style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                Esqueceu a senha?
              </button>
            </div>

            {erro && <p className="text-[15px] text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{erro}</p>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-transform disabled:opacity-70"
              style={{
                padding: '14px',
                background: 'linear-gradient(135deg,#13305c,#0a1c3a)',
                color: '#fff',
                boxShadow: '0 14px 30px -14px rgba(10,28,58,.8)',
              }}>
              {loading ? <Spinner size={15} className="text-white" /> : 'Entrar'}
            </button>
          </form>

          <p className="text-center mt-7" style={{ fontSize: 13.5, color: '#6b7895' }}>
            Não tem conta?{' '}
            <button type="button" onClick={() => navigate('/comecar')}
              className="hover:underline font-semibold" style={{ color: NAVY }}>
              Criar conta
            </button>
          </p>

          <p className="text-center" style={{ fontSize: 11.5, lineHeight: 1.6, color: '#9aa6bf', margin: '26px auto 0', maxWidth: 300 }}>
            Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade da LexRun.
          </p>
        </div>
      </div>
    </div>
  )
}
