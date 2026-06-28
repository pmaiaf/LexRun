import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortal } from './PortalContext.jsx'
import { Eye, EyeOff, Scale } from 'lucide-react'
import { Spinner } from '../../components/ui/index.jsx'

export default function PortalLoginPage() {
  const { portalLogin } = usePortal()
  const navigate = useNavigate()
  const [form, setForm]         = useState({ email: '', senha: '', escritorioSlug: '' })
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setErro('')
    try {
      await portalLogin(form.email, form.senha, form.escritorioSlug || undefined)
      navigate('/portal/dashboard')
    } catch (err) {
      setErro(err.message || 'E-mail ou senha incorretos.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".9"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".25"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Portal do Cliente</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse seus processos e documentos</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="seu@email.com" required />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-600">Senha</label>
                <button type="button" onClick={() => navigate('/portal/esqueci-senha')} className="text-xs text-brand-700 hover:underline">Esqueci a senha</button>
              </div>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} className="input pr-10"
                  value={form.senha} onChange={e => setForm(f => ({...f, senha: e.target.value}))}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Slug do escritório — opcional se vier por URL */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Código do escritório
                <span className="text-gray-400 font-normal ml-1">(fornecido pelo seu advogado)</span>
              </label>
              <input className="input font-mono" value={form.escritorioSlug}
                onChange={e => setForm(f => ({...f, escritorioSlug: e.target.value}))}
                placeholder="Ex: andrade-associados" />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm text-red-600">{erro}</div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2">
              {loading ? <Spinner size={15} className="text-white" /> : 'Entrar no portal'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Esqueceu sua senha?{' '}
            <a href="mailto:contato@escritorio.adv.br" className="text-brand-700 hover:underline">
              Entre em contato com seu advogado
            </a>
          </p>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-5">
          Powered by{' '}
          <a href="/" className="text-brand-600 font-medium hover:underline">LexRun</a>
        </p>
      </div>
    </div>
  )
}
