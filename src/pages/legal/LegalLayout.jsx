import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import lexrunLogo from '../../assets/lexrun-logo-nova.png'

/**
 * Layout compartilhado pelas páginas jurídicas (Termos, Privacidade, Reembolso).
 * Header e footer alinhados com a landing page (logo nova, footer estruturado).
 */
export default function LegalLayout({ titulo, atualizadoEm, children }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper text-brand-900 flex flex-col">
      <header className="border-b border-brand-900/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src={lexrunLogo} alt="LexRun" className="h-14 w-auto" />
          </button>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-brand-900/50 hover:text-brand-900">
            <ArrowLeft size={12}/> Voltar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14 flex-1">
        <h1 className="font-display font-semibold text-3xl mb-2">{titulo}</h1>
        <p className="text-xs text-brand-900/40 mb-10">Última atualização: {atualizadoEm}</p>
        <div className="prose-legal space-y-6 text-[15px] leading-relaxed text-brand-900/75">
          {children}
        </div>
      </main>

      <footer className="border-t border-brand-900/[0.07] bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img src={lexrunLogo} alt="LexRun" className="h-16 w-auto -ml-1 mb-2" />
              <p className="text-xs text-brand-900/50 leading-relaxed max-w-[200px]">
                Gestão jurídica completa para escritórios de advocacia, do início ao encerramento do processo.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-3">Produto</p>
              <ul className="space-y-2 text-sm text-brand-900/55">
                <li><a href="/#recursos" className="hover:text-brand-900">Recursos</a></li>
                <li><a href="/#planos" className="hover:text-brand-900">Planos</a></li>
                <li><a href="/#faq" className="hover:text-brand-900">Perguntas frequentes</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-3">Acesso</p>
              <ul className="space-y-2 text-sm text-brand-900/55">
                <li><button onClick={() => navigate('/login')} className="hover:text-brand-900">Entrar</button></li>
                <li><button onClick={() => navigate('/comecar')} className="hover:text-brand-900">Criar conta</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-brand-900/55">
                <li><a href="/termos-de-uso" className="hover:text-brand-900">Termos de Uso</a></li>
                <li><a href="/politica-de-privacidade" className="hover:text-brand-900">Privacidade</a></li>
                <li><a href="/politica-de-reembolso" className="hover:text-brand-900">Reembolso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-900/[0.07] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-brand-900/40">© {new Date().getFullYear()} LexRun. Todos os direitos reservados.</p>
            <p className="text-xs text-brand-900/40">contato@lexrun.com.br</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
