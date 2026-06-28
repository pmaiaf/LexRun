import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { authService } from '../services/api.js'
import { Spinner } from '../components/ui/index.jsx'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }

    setLoading(true)
    try {
      await authService.redefinirSenha(token, novaSenha)
      setSucesso(true)
    } catch (err) {
      setErro(err.message || 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm text-center">
          <AlertCircle size={36} className="text-amber-500 mx-auto mb-4"/>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-sm text-gray-500 mb-6">Este link de recuperação está incompleto. Solicite um novo.</p>
          <button onClick={() => navigate('/esqueci-senha')} className="btn-primary w-full py-2.5">Solicitar novo link</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm">
        {sucesso ? (
          <div className="text-center">
            <CheckCircle2 size={36} className="text-green-500 mx-auto mb-4"/>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Senha redefinida!</h1>
            <p className="text-sm text-gray-500 mb-6">Sua senha foi alterada com sucesso.</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-2.5">Ir para o login</button>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="text-3xl font-semibold text-gray-900">Crie uma nova senha</h1>
              <p className="text-gray-500 mt-1.5 text-base">Escolha uma senha forte para sua conta.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-2">Nova senha</label>
                <div className="relative">
                  <input type={showSenha ? 'text' : 'password'} className="input pr-10" value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)} placeholder="••••••••" required/>
                  <button type="button" onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenha ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-2">Confirmar nova senha</label>
                <input type={showSenha ? 'text' : 'password'} className="input" value={confirmar}
                  onChange={e => setConfirmar(e.target.value)} placeholder="••••••••" required/>
              </div>
              {erro && <p className="text-[15px] text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{erro}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {loading ? <Spinner size={15} className="text-white"/> : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
