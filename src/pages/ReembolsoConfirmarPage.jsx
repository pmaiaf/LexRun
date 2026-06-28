import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Banknote } from 'lucide-react'
import { assinaturaService } from '../services/api.js'
import { Spinner } from '../components/ui/index.jsx'

export default function ReembolsoConfirmarPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [estado, setEstado] = useState('aguardando') // aguardando | processando | sucesso | erro
  const [erro, setErro] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token'))
  }, [])

  async function handleConfirmar() {
    setEstado('processando')
    setErro('')
    try {
      await assinaturaService.confirmarReembolso(token)
      setEstado('sucesso')
    } catch (err) {
      setErro(err.message || 'Não foi possível confirmar o reembolso.')
      setEstado('erro')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm text-center">
          <AlertCircle size={36} className="text-amber-500 mx-auto mb-4"/>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-sm text-gray-500 mb-6">Este link de confirmação de reembolso está incompleto.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full py-2.5">Ir para o login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm text-center">
        {estado === 'sucesso' ? (
          <>
            <CheckCircle2 size={36} className="text-green-500 mx-auto mb-4"/>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Reembolso confirmado</h1>
            <p className="text-sm text-gray-500 mb-6">
              Sua assinatura foi cancelada e o reembolso já foi solicitado à operadora do seu cartão.
              Você receberá um e-mail de confirmação com os detalhes.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-2.5">Ir para o login</button>
          </>
        ) : estado === 'erro' ? (
          <>
            <AlertCircle size={36} className="text-red-500 mx-auto mb-4"/>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Não foi possível confirmar</h1>
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg mb-6">{erro}</p>
            <button onClick={() => navigate('/planos')} className="btn-primary w-full py-2.5">Voltar para Planos</button>
          </>
        ) : (
          <>
            <Banknote size={36} className="text-brand-700 mx-auto mb-4"/>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Confirmar reembolso?</h1>
            <p className="text-sm text-gray-500 mb-6">
              Ao confirmar, sua assinatura LexRun será <strong>cancelada imediatamente</strong> e o valor pago será
              devolvido ao seu método de pagamento original. Esta ação não pode ser desfeita.
            </p>
            <button onClick={handleConfirmar} disabled={estado === 'processando'}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {estado === 'processando' ? <Spinner size={15} className="text-white"/> : 'Confirmar reembolso e cancelamento'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
