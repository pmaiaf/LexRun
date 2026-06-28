import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Send, Mail, Copy, Zap, Pencil, Check } from 'lucide-react'
import { iaDocumentosService } from '../services/api.js'
import { FormField, useToast } from './ui/index.jsx'
import { useApi } from '../hooks/useApi.js'

const TIPOS = [
  { id: 'peca_simples', label: 'Peça simples',  desc: 'Manifestações, requerimentos e peças objetivas' },
  { id: 'peticao',      label: 'Petição',        desc: 'Petição completa com fatos, fundamentos e pedidos' },
  { id: 'procuracao',   label: 'Procuração',     desc: 'Ad Judicia Et Extra, pronta para assinatura' },
]

/**
 * Gerador de documentos via IA, vinculado a um processo (e ao cliente dele).
 * Provedor de IA é o configurado pelo escritório em Configurações > Integrações
 * (chave própria ou padrão da plataforma) — este componente não sabe qual é.
 */
export default function GeradorIA({ processo }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [tipo, setTipo] = useState('peca_simples')
  const [instrucoes, setInstrucoes] = useState('')
  const [gerando, setGerando] = useState(false)
  const [documento, setDocumento] = useState(null) // resultado salvo (documentos_ia)
  const [enviando, setEnviando] = useState(null) // 'email' | 'whatsapp' | null
  const [limiteAtingido, setLimiteAtingido] = useState(false)
  const [editando, setEditando] = useState(false)
  const [textoEditado, setTextoEditado] = useState('')
  const [salvando, setSalvando] = useState(false)

  const { data: statusIA, refetch: refetchStatusIA } = useApi(() => iaDocumentosService.status(), [])
  const usandoChavePropria = statusIA?.tem_chave_propria
  const limiteMensal = statusIA?.limite_mensal // null = ilimitado
  const usadas = statusIA?.geracoes_usadas_mes ?? 0
  const pertoDoLimite = !usandoChavePropria && limiteMensal && usadas >= limiteMensal * 0.8

  async function handleGerar(e) {
    e.preventDefault()
    if (!instrucoes.trim()) { toast.error('Descreva o que o documento deve conter.'); return }
    setGerando(true)
    setLimiteAtingido(false)
    try {
      const doc = await iaDocumentosService.gerar({
        tipo,
        instrucoes,
        processo_id: processo?.id,
        cliente_id: processo?.cliente_id,
      })
      setDocumento(doc)
      toast.success('Documento gerado!')
      refetchStatusIA()
    } catch (err) {
      if (err.status === 403) {
        setLimiteAtingido(true)
      } else {
        toast.error(err.message)
      }
    }
    finally { setGerando(false) }
  }

  async function handleEnviar(canal) {
    setEnviando(canal)
    try {
      await iaDocumentosService.enviar(documento.id, canal)
      toast.success(canal === 'email' ? 'Enviado por e-mail!' : 'Enviado por WhatsApp!')
    } catch (err) {
      if (canal === 'whatsapp' && err.message?.includes('não configurado')) {
        toast.error('WhatsApp não configurado — tente enviar por e-mail.')
      } else {
        toast.error(err.message)
      }
    } finally {
      setEnviando(null)
    }
  }

  function copiar() {
    navigator.clipboard.writeText(documento.conteudo_gerado)
    toast.success('Texto copiado!')
  }

  function iniciarEdicao() {
    setTextoEditado(documento.conteudo_gerado)
    setEditando(true)
  }

  async function salvarEdicao() {
    if (!textoEditado.trim()) { toast.error('O documento não pode ficar vazio.'); return }
    setSalvando(true)
    try {
      const atualizado = await iaDocumentosService.atualizar(documento.id, textoEditado)
      setDocumento(atualizado)
      setEditando(false)
      toast.success('Documento atualizado!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (limiteAtingido) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <Zap size={20} className="text-amber-500"/>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-1">Limite de gerações do mês atingido</p>
        <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">
          Seu plano atual permite {limiteMensal} gerações de IA por mês. Faça upgrade para continuar gerando documentos sem interrupção, ou conecte sua própria chave de API em Configurações.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => setLimiteAtingido(false)} className="btn-secondary text-xs">Voltar</button>
          <button onClick={() => navigate('/planos')} className="btn-primary text-xs">Ver planos</button>
        </div>
      </div>
    )
  }

  if (documento) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800">{TIPOS.find(t => t.id === documento.tipo)?.label}</p>
          {!editando && (
            <button onClick={() => setDocumento(null)} className="btn-ghost text-xs text-gray-500">← Gerar outro</button>
          )}
        </div>

        {editando ? (
          <>
            <textarea
              className="input resize-none text-xs leading-relaxed w-full"
              rows={12}
              value={textoEditado}
              onChange={e => setTextoEditado(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setEditando(false)} disabled={salvando}
                className="btn-secondary text-xs flex-1 justify-center">
                Cancelar
              </button>
              <button onClick={salvarEdicao} disabled={salvando}
                className="btn-primary text-xs flex items-center gap-1.5 flex-1 justify-center">
                {salvando
                  ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                  : <Check size={12}/>}
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{documento.conteudo_gerado}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={iniciarEdicao} className="btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center">
                <Pencil size={12}/> Editar
              </button>
              <button onClick={copiar} className="btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center">
                <Copy size={12}/> Copiar
              </button>
              <button onClick={() => handleEnviar('email')} disabled={enviando === 'email'}
                className="btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center">
                <Mail size={12}/> {enviando === 'email' ? 'Enviando...' : 'E-mail'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleGerar} className="space-y-4">
      {!usandoChavePropria && limiteMensal != null && (
        <div className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs ${pertoDoLimite ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
          <span>{usadas} de {limiteMensal} gerações usadas este mês</span>
          {pertoDoLimite && <button type="button" onClick={() => navigate('/planos')} className="font-medium underline">Fazer upgrade</button>}
        </div>
      )}
      <FormField label="Tipo de documento">
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map(t => (
            <button key={t.id} type="button" onClick={() => setTipo(t.id)}
              className={`text-left p-2.5 rounded-lg border text-xs transition-colors
                ${tipo === t.id ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
              <p className="font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="O que o documento deve conter?" required>
        <textarea className="input resize-none text-xs" rows={4}
          placeholder={
            tipo === 'procuracao'
              ? 'Ex: poderes para representação em todas as fases do processo, incluindo recursos.'
              : 'Ex: requerimento de juntada do comprovante de pagamento das custas processuais.'
          }
          value={instrucoes} onChange={e => setInstrucoes(e.target.value)} required/>
      </FormField>
      <button type="submit" disabled={gerando} className="btn-primary w-full flex items-center justify-center gap-2">
        {gerando
          ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
          : <Sparkles size={14}/>
        }
        {gerando ? 'Gerando com IA...' : 'Gerar documento'}
      </button>
    </form>
  )
}
