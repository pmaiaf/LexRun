import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAdmin } from './AdminContext.jsx'

export default function AdminLoginPage() {
  const { adminLogin } = useAdmin()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await adminLogin(email, senha)
      navigate('/admin/dashboard')
    } catch (err) {
      setErro(err.message || 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
            <ShieldCheck size={18} className="text-gray-300"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">LexRun</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Painel administrativo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {erro && (
            <div className="bg-red-950 border border-red-900 text-red-300 text-xs rounded-lg px-3 py-2">
              {erro}
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-gray-500"
              placeholder="admin@lexrun.com.br"/>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Senha</label>
            <input type="password" required value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-gray-500"
              placeholder="••••••••"/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-white text-gray-900 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-500 mt-4">
          Acesso restrito à equipe do LexRun.
        </p>
      </div>
    </div>
  )
}
