import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { portalService } from '../../services/api.js'
import { Spinner } from '../../components/ui/index.jsx'

export default function PortalForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await portalService.esqueciSenha(email)
      setEnviado(true)
    } catch (err) {
      setErro(err.message || 'Não foi possível processar sua solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/portal/login')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={13}/> Voltar ao login
        </button>

        {enviado ? (
          <div className="text-center">
            <CheckCircle2 size={36} className="text-green-500 mx-auto mb-4"/>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifique seu e-mail</h1>
            <p className="text-base text-gray-500 leading-relaxed">
              Se <strong>{email}</strong> estiver cadastrado e com portal ativo, você vai receber um link para redefinir sua senha em poucos minutos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="text-3xl font-semibold text-gray-900">Esqueceu sua senha?</h1>
              <p className="text-gray-500 mt-1.5 text-base">Informe seu e-mail e enviaremos um link para redefini-la.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-2">E-mail</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required/>
              </div>
              {erro && <p className="text-[15px] text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{erro}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {loading ? <Spinner size={15} className="text-white"/> : <><Mail size={15}/> Enviar link de recuperação</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
