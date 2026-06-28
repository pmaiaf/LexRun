import { useNavigate } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'
import lexrunLogo from '../../assets/lexrun-logo-nova.png'

export default function SignupCancelledPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-10">
        <img src={lexrunLogo} alt="LexRun" className="h-14 w-auto" />
      </div>

      <div className="w-full max-w-md bg-white border border-brand-900/[0.07] rounded-2xl p-8 text-center">
        <h1 className="font-display font-semibold text-xl text-brand-900 mb-2">Checkout cancelado</h1>
        <p className="text-sm text-brand-900/55 mb-6">
          Nenhuma cobrança foi feita. Você pode tentar novamente quando quiser.
        </p>
        <button onClick={() => navigate('/comecar')}
          className="w-full bg-brand-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={14}/> Voltar para o cadastro
        </button>
      </div>
    </div>
  )
}
