import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import lexrunLogo from '../../assets/lexrun-logo-nova.png'
import { useApi } from '../../hooks/useApi.js'
import { assinaturaService, cadastroService } from '../../services/api.js'

const PUBLICO_POR_PLANO = {
  basico: 'Advogados autônomos e recém-formados',
  professional: 'Pequenos e médios escritórios',
  banca: 'Bancas e escritórios consolidados',
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { data: planos } = useApi(() => assinaturaService.planos(), [])

  const [etapa, setEtapa] = useState(1)
  const [form, setForm] = useState({ nomeEscritorio: '', nome: '', email: '', oab: '', plano: '' })
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

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <img src={lexrunLogo} alt="LexRun" className="h-14 w-auto" />
        </button>
        <div className="flex items-center gap-2 text-xs text-brand-900/40">
          <span className={etapa === 1 ? 'text-brand-900 font-medium' : ''}>1. Seus dados</span>
          <span>→</span>
          <span className={etapa === 2 ? 'text-brand-900 font-medium' : ''}>2. Plano</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {erro && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {erro}
            </div>
          )}

          {etapa === 1 ? (
            <form onSubmit={avancar} className="bg-white border border-brand-900/[0.07] rounded-2xl p-7 space-y-4">
              <div>
                <h1 className="font-display font-semibold text-3xl text-brand-900 mb-1.5">Crie sua conta</h1>
                <p className="text-base text-brand-900/55">Comece a usar o LexRun no seu escritório.</p>
              </div>

              <div>
                <label className="block text-sm text-brand-900/65 mb-2">Nome do escritório *</label>
                <input className="w-full border border-brand-900/10 rounded-lg px-4 py-3 text-base outline-none focus:border-accent-500"
                  value={form.nomeEscritorio} onChange={e => set('nomeEscritorio', e.target.value)}
                  placeholder="Ex: Andrade Advocacia" required/>
              </div>
              <div>
                <label className="block text-sm text-brand-900/65 mb-2">Seu nome completo *</label>
                <input className="w-full border border-brand-900/10 rounded-lg px-4 py-3 text-base outline-none focus:border-accent-500"
                  value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Marcos Andrade" required/>
              </div>
              <div>
                <label className="block text-sm text-brand-900/65 mb-2">E-mail *</label>
                <input type="email" className="w-full border border-brand-900/10 rounded-lg px-4 py-3 text-base outline-none focus:border-accent-500"
                  value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@escritorio.adv.br" required/>
                <p className="text-[11px] text-brand-900/40 mt-1">Seus dados de acesso serão enviados para este e-mail após a confirmação do pagamento.</p>
              </div>
              <div>
                <label className="block text-sm text-brand-900/65 mb-2">OAB (opcional)</label>
                <input className="w-full border border-brand-900/10 rounded-lg px-4 py-3 text-base outline-none focus:border-accent-500"
                  value={form.oab} onChange={e => set('oab', e.target.value)} placeholder="Ex: 123456/MG"/>
              </div>

              <button type="submit" className="w-full bg-brand-900 text-white py-3.5 rounded-xl text-base font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 mt-2">
                Continuar para o plano <ArrowRight size={14}/>
              </button>

              <p className="text-center text-xs text-brand-900/40">
                Já tem conta? <button type="button" onClick={() => navigate('/login')} className="text-accent-600 hover:underline">Entrar</button>
              </p>
            </form>
          ) : (
            <div className="bg-white border border-brand-900/[0.07] rounded-2xl p-7">
              <button onClick={() => setEtapa(1)} className="flex items-center gap-1.5 text-xs text-brand-900/50 hover:text-brand-900 mb-5">
                <ArrowLeft size={12}/> Voltar
              </button>
              <h1 className="font-display font-semibold text-3xl text-brand-900 mb-1.5">Escolha seu plano</h1>
              <p className="text-base text-brand-900/55 mb-6">Você será redirecionado para um checkout seguro da Stripe.</p>

              <div className="space-y-3">
                {(planos || [{ chave: 'basico', nome: 'Básico', valor: 97 }, { chave: 'professional', nome: 'Professional', valor: 197 }, { chave: 'banca', nome: 'Banca', valor: 397 }]).map(plano => {
                  const selecionado = form.plano === plano.chave
                  return (
                    <button key={plano.chave} type="button" disabled={enviando}
                      onClick={() => handleAssinar(plano.chave)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        selecionado ? 'border-accent-500 bg-accent-100/40' : 'border-brand-900/10 hover:border-brand-900/25'
                      }`}>
                      <div>
                        <p className="text-sm font-medium text-brand-900">{plano.nome}</p>
                        <p className="text-xs text-brand-900/45">{PUBLICO_POR_PLANO[plano.chave]}</p>
                      </div>
                      <div className="text-right flex items-center gap-2 flex-shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-brand-900">R${plano.valor}</p>
                          <p className="text-[10px] text-brand-900/40">/mês</p>
                        </div>
                        {enviando && selecionado
                          ? <Loader2 size={16} className="animate-spin text-accent-600"/>
                          : selecionado ? <Check size={16} className="text-accent-600"/> : null
                        }
                      </div>
                    </button>
                  )
                })}
              </div>

              <label className="flex items-start gap-2.5 mt-6 cursor-pointer">
                <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-brand-900/20 text-accent-600 focus:ring-accent-500"/>
                <span className="text-xs text-brand-900/55 leading-relaxed">
                  Li e aceito os{' '}
                  <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">Termos de Uso</a>{' '}
                  e a{' '}
                  <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">Política de Privacidade</a>.
                </span>
              </label>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
