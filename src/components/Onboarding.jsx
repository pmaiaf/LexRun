import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, X, ArrowRight, Sparkles, Rocket, Lightbulb } from 'lucide-react'
import { clientesService, processosService } from '../services/api.js'

// ── Guia de primeiros passos (checklist inteligente) ────────────────────────
// Detecta automaticamente o que o escritório já fez (tem cliente? tem
// processo? ativou portal?) e marca cada passo sozinho. Some quando tudo
// está concluído. O estado de "dispensado" fica só no navegador
// (localStorage NÃO é usado aqui porque artifacts não suportam; usamos uma
// flag no backend via escritorio? Não — mantemos em memória + checagem real
// dos dados, então some naturalmente quando os passos são cumpridos).

const PASSOS = [
  {
    chave: 'cliente',
    titulo: 'Cadastre seu primeiro cliente',
    texto: 'Comece adicionando um cliente — pessoa física ou jurídica.',
    rota: '/clientes',
  },
  {
    chave: 'processo',
    titulo: 'Crie seu primeiro processo',
    texto: 'Cadastre um processo e vincule a um cliente. Você pode informar o número CNJ para sincronizar com os tribunais.',
    rota: '/processos',
  },
  {
    chave: 'portal',
    titulo: 'Ative o portal de um cliente',
    texto: 'Dê ao seu cliente acesso para acompanhar os próprios processos e cobranças.',
    rota: '/clientes',
  },
]

export function GuiaPrimeirosPassos() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null) // { cliente: bool, processo: bool, portal: bool }
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    let ativo = true
    async function checar() {
      try {
        const [clientesResp, processosResp] = await Promise.all([
          clientesService.listar({ limit: 50 }).catch(() => null),
          processosService.listar({ limit: 1 }).catch(() => null),
        ])
        if (!ativo) return
        const clientes = clientesResp?.data || clientesResp || []
        const temCliente  = Array.isArray(clientes) && clientes.length > 0
        const temProcesso = (processosResp?.total || processosResp?.data?.length || 0) > 0
        const temPortal   = Array.isArray(clientes) && clientes.some(c => c.portal_ativo)
        setStatus({ cliente: temCliente, processo: temProcesso, portal: temPortal })
      } catch {
        if (ativo) setStatus({ cliente: false, processo: false, portal: false })
      }
    }
    checar()
    return () => { ativo = false }
  }, [])

  if (!status || dispensado) return null

  const concluidos = PASSOS.filter(p => status[p.chave]).length
  // Se já completou tudo, não mostra o guia.
  if (concluidos === PASSOS.length) return null

  const proximo = PASSOS.find(p => !status[p.chave])

  return (
    <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-5 text-white relative overflow-hidden">
      <button onClick={() => setDispensado(true)}
        className="absolute top-3 right-3 text-white/50 hover:text-white/90" aria-label="Dispensar guia">
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Rocket size={16} className="text-gold-400" />
        <h2 className="text-sm font-semibold">Primeiros passos no LexRun</h2>
      </div>
      <p className="text-xs text-white/60 mb-4">
        {concluidos} de {PASSOS.length} concluídos — complete a configuração inicial do seu escritório.
      </p>

      <div className="space-y-2 mb-4">
        {PASSOS.map((p) => {
          const feito = status[p.chave]
          return (
            <button key={p.chave}
              onClick={() => navigate(p.rota)}
              className={`w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 transition-colors ${
                feito ? 'bg-white/5' : 'bg-white/10 hover:bg-white/15'
              }`}>
              {feito
                ? <CheckCircle2 size={18} className="text-gold-400 flex-shrink-0 mt-0.5" />
                : <Circle size={18} className="text-white/40 flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${feito ? 'text-white/50 line-through' : 'text-white'}`}>{p.titulo}</p>
                {!feito && <p className="text-xs text-white/55 mt-0.5">{p.texto}</p>}
              </div>
              {!feito && <ArrowRight size={14} className="text-white/40 flex-shrink-0 mt-1" />}
            </button>
          )
        })}
      </div>

      {proximo && (
        <button onClick={() => navigate(proximo.rota)}
          className="w-full bg-white text-brand-900 rounded-xl py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
          {proximo.titulo} <ArrowRight size={15} />
        </button>
      )}
    </div>
  )
}

// ── Dica contextual por tela (aparece uma vez em cada aba) ──────────────────
// Um banner discreto no topo de cada página explicando o que aquela tela faz
// e qual a primeira ação. Fecha ao clicar em "entendi" e não volta (marca
// no navegador por chave). É a "documentação dentro do sistema" pedida pelos
// advogados — cada tela se explica na primeira visita.

export function DicaDaTela({ chave, titulo, children }) {
  const storageKey = `jf_dica_${chave}`
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setVisivel(true)
  }, [storageKey])

  if (!visivel) return null

  function fechar() {
    localStorage.setItem(storageKey, '1')
    setVisivel(false)
  }

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
      <Lightbulb size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {titulo && <p className="text-sm font-medium text-brand-900 mb-0.5">{titulo}</p>}
        <p className="text-xs text-brand-800/80 leading-relaxed">{children}</p>
      </div>
      <button onClick={fechar} className="text-xs font-medium text-brand-600 hover:text-brand-800 flex-shrink-0 whitespace-nowrap">
        Entendi
      </button>
    </div>
  )
}

// ── Tour de boas-vindas (primeiro login) ────────────────────────────────────
// Modal sequencial simples que explica as áreas principais do sistema.
// Aparece uma vez; ao terminar ou pular, não volta na mesma sessão.

const ETAPAS_TOUR = [
  {
    icone: Sparkles,
    titulo: 'Bem-vindo ao LexRun! 👋',
    texto: 'Vamos te mostrar rapidamente como o sistema funciona. São só alguns passos — leva menos de um minuto.',
  },
  {
    icone: null,
    titulo: 'Menu lateral',
    texto: 'À esquerda você encontra tudo: Dashboard, Processos, Clientes, Agenda, Financeiro e o Portal do Cliente. No celular, toque no ícone ☰ no topo para abrir o menu.',
  },
  {
    icone: null,
    titulo: 'Clientes e Processos',
    texto: 'Comece cadastrando um cliente, depois crie processos vinculados a ele. Em cada processo você pode registrar horas, gerar documentos (inclusive com IA) e sincronizar movimentações com os tribunais pelo número CNJ.',
  },
  {
    icone: null,
    titulo: 'Portal do Cliente',
    texto: 'Ative o portal para que seu cliente acompanhe os próprios processos, documentos e cobranças — sem precisar te ligar a cada novidade.',
  },
  {
    icone: Rocket,
    titulo: 'Tudo pronto!',
    texto: 'Use o guia de "Primeiros passos" no Dashboard para concluir a configuração inicial. Bom trabalho!',
  },
]

export function TourBoasVindas({ aberto, onFechar }) {
  const [etapa, setEtapa] = useState(0)
  if (!aberto) return null

  const e = ETAPAS_TOUR[etapa]
  const Icone = e.icone
  const ultima = etapa === ETAPAS_TOUR.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button onClick={onFechar} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500" aria-label="Fechar">
          <X size={18} />
        </button>

        {Icone && (
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
            <Icone size={22} className="text-brand-700" />
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-2">{e.titulo}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{e.texto}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {ETAPAS_TOUR.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === etapa ? 'w-5 bg-brand-700' : 'w-1.5 bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {!ultima && (
              <button onClick={onFechar} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Pular</button>
            )}
            <button
              onClick={() => ultima ? onFechar() : setEtapa(etapa + 1)}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
              {ultima ? 'Começar' : 'Próximo'} {!ultima && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
