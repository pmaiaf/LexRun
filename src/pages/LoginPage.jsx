import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Eye, EyeOff } from 'lucide-react'
import { Spinner } from '../components/ui/index.jsx'
import { MockupKanbanPro } from './landing/LandingMockupsPro.jsx'
import lexrunLogo from '../assets/lexrun-logo-nova.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form,      setForm]      = useState({ email: '', senha: '' })
  const [showSenha, setShowSenha] = useState(false)
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
      {/* Left panel — mockup do sistema sobre o azul-marinho */}
      <div className="hidden lg:flex w-1/2 bg-brand-800 relative overflow-hidden flex-col justify-between p-12">
        {/* Logo no topo */}
        <div className="flex items-center gap-3 z-10">
          <div className="bg-paper rounded-xl px-3 py-2 inline-flex items-center">
            <img src={lexrunLogo} alt="LexRun" className="h-11 w-auto" />
          </div>
        </div>

        {/* Mockup do sistema flutuando */}
        <div className="relative z-10 flex items-center justify-center flex-1 py-8">
          <div className="w-full max-w-lg">
            <div className="rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10">
              <MockupKanbanPro className="w-full h-auto block"/>
            </div>
          </div>
        </div>

        {/* Frase no rodapé */}
        <div className="z-10">
          <p className="text-white text-xl font-display font-semibold leading-snug mb-2">
            A gestão do seu escritório em um só lugar.
          </p>
          <p className="text-white/55 text-sm">
            Processos, agenda, financeiro e portal do cliente — com sincronização automática dos tribunais.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">Bem-vindo de volta</h1>
            <p className="text-gray-500 mt-1.5 text-base">Acesse o painel do seu escritório</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[15px] font-medium text-gray-700 mb-2">E-mail</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com" required />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[15px] font-medium text-gray-700">Senha</label>
                <button type="button" onClick={() => navigate('/esqueci-senha')} className="text-sm text-brand-700 hover:underline">Esqueci a senha</button>
              </div>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} className="input pr-10"
                  value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {erro && <p className="text-[15px] text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{erro}</p>}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? <Spinner size={15} className="text-white" /> : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            Não tem conta?{' '}
            <button type="button" onClick={() => navigate('/comecar')} className="text-brand-700 hover:underline font-medium">Criar conta</button>
          </p>
        </div>
      </div>
    </div>
  )
}
