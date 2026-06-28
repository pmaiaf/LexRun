import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail, Loader2, Scale } from 'lucide-react'
import lexrunLogo from '../../assets/lexrun-logo-nova.png'
import { cadastroService } from '../../services/api.js'

const TENTATIVAS_MAX = 20 // ~40s de polling, tempo de sobra para o webhook chegar

export default function SignupSuccessPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('aguardando') // aguardando | pronto | demorando
  const [email, setEmail] = useState('')
  const tentativasRef = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) { setStatus('demorando'); return }

    let cancelado = false
    async function verificar() {
      try {
        const res = await cadastroService.status(sessionId)
        if (cancelado) return
        setEmail(res.email)
        if (res.pronto) {
          setStatus('pronto')
          return
        }
        tentativasRef.current += 1
        if (tentativasRef.current >= TENTATIVAS_MAX) {
          setStatus('demorando')
          return
        }
        setTimeout(verificar, 2000)
      } catch {
        if (!cancelado) setStatus('demorando')
      }
    }
    verificar()
    return () => { cancelado = true }
  }, [])

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-10">
        <img src={lexrunLogo} alt="LexRun" className="h-14 w-auto" />
      </div>

      <div className="w-full max-w-md bg-white border border-brand-900/[0.07] rounded-2xl p-8 text-center">
        {status === 'aguardando' && (
          <>
            <Loader2 size={36} className="text-accent-500 animate-spin mx-auto mb-5"/>
            <h1 className="font-display font-semibold text-xl text-brand-900 mb-2">Confirmando seu pagamento...</h1>
            <p className="text-sm text-brand-900/55">Isso leva só alguns segundos. Não feche esta página.</p>
          </>
        )}

        {status === 'pronto' && (
          <>
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-5"/>
            <h1 className="font-display font-semibold text-xl text-brand-900 mb-2">Pagamento confirmado!</h1>
            <p className="text-sm text-brand-900/55 mb-1">Sua conta já está ativa.</p>
            <p className="text-sm text-brand-900/55 mb-6">
              Enviamos os dados de acesso para <strong className="text-brand-900">{email}</strong>.
            </p>
            <button onClick={() => navigate('/login')}
              className="w-full bg-brand-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              Ir para o login
            </button>
          </>
        )}

        {status === 'demorando' && (
          <>
            <Mail size={36} className="text-gold-500 mx-auto mb-5"/>
            <h1 className="font-display font-semibold text-xl text-brand-900 mb-2">Quase lá</h1>
            <p className="text-sm text-brand-900/55 mb-6">
              Seu pagamento está sendo processado. Em poucos minutos você receberá um e-mail com os dados de acesso.
              Se não chegar, verifique a caixa de spam ou entre em contato com o suporte.
            </p>
            <button onClick={() => navigate('/login')}
              className="w-full bg-white border border-brand-900/15 text-brand-900 py-3 rounded-xl text-sm font-medium hover:bg-brand-900/[0.03] transition-colors">
              Ir para o login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
