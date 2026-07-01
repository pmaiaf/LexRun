import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import lexrunLogo from '../../assets/lexrun-logo.png'

/**
 * Layout compartilhado pelas páginas jurídicas (Termos, Privacidade, Reembolso).
 * Header e footer alinhados com a landing page (logo nova, footer estruturado).
 *
 * Dados da controladora (razão social / CNPJ) centralizados aqui para
 * aparecerem de forma consistente em todas as páginas legais.
 */
export const RAZAO_SOCIAL = 'RDPZ TECNOLOGIA LTDA'
export const CNPJ = '56.423.094/0001-66'

export default function LegalLayout({ titulo, atualizadoEm, children }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper text-brand-900 flex flex-col">
      {/* fio dourado no topo */}
      <div className="h-1 w-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400" />

      <header className="border-b border-brand-900/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src={lexrunLogo} alt="LexRun" className="h-24 w-auto" />
          </button>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-medium text-brand-900/50 hover:text-brand-900 transition-colors">
            <ArrowLeft size={12}/> Voltar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 flex-1 w-full">
        {/* cabeçalho do documento */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-600 mb-3">Documentos legais</p>
        <h1 className="font-display font-semibold text-4xl tracking-tight leading-tight mb-4">{titulo}</h1>
        <div className="flex items-center gap-3 mb-1">
          <span className="h-px w-10 bg-gold-500/60" />
          <p className="text-xs text-brand-900/45">Última atualização: {atualizadoEm}</p>
        </div>

        {/* corpo */}
        <div className="prose-legal space-y-6 text-[15px] leading-[1.75] text-brand-900/75 mt-10">
          {children}
        </div>

        {/* identificação da empresa (controladora) */}
        <div className="mt-14 rounded-2xl border border-brand-900/[0.08] bg-white/70 px-6 py-5 shadow-[0_1px_2px_rgba(15,30,48,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-900/45 mb-2">Identificação da empresa</p>
          <p className="text-sm text-brand-900/80 leading-relaxed">
            A plataforma LexRun é operada por <strong className="text-brand-900">{RAZAO_SOCIAL}</strong>,
            inscrita no CNPJ sob o nº <strong className="text-brand-900">{CNPJ}</strong>.
          </p>
        </div>
      </main>

      <footer className="border-t border-brand-900/[0.07] bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img src={lexrunLogo} alt="LexRun" className="h-24 w-auto object-contain scale-110" />
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
            <p className="text-xs text-brand-900/40">© {new Date().getFullYear()} {RAZAO_SOCIAL} · CNPJ {CNPJ}. Todos os direitos reservados.</p>
            <p className="text-xs text-brand-900/40">contato@lexrun.com.br</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
