import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, Loader2, AlertTriangle, Zap } from 'lucide-react'

// ── Toast ─────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const toast = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
    warning: (msg) => add(msg, 'warning'),
  }

  const ICONS = {
    success: <CheckCircle  size={15} className="text-green-600 flex-shrink-0" />,
    error:   <AlertCircle  size={15} className="text-red-500   flex-shrink-0" />,
    info:    <Info         size={15} className="text-blue-500  flex-shrink-0" />,
    warning: <AlertTriangle size={15} className="text-amber-500 flex-shrink-0"/>,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right-4"
          >
            {ICONS[t.type]}
            <p className="text-sm text-gray-700 flex-1">{t.msg}</p>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() { return useContext(ToastContext) }

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-gray-400 ${className}`} />
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={24} className="text-brand-700" />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}

// ── ErrorBlock ────────────────────────────────────────────────────────────────
// Quando o erro vier de um bloqueio de plano (status 403 com limite_atingido
// no corpo), mostra o aviso de upgrade em vez do bloco de erro genérico —
// "tentar novamente" não ajuda nesse caso, e confunde o usuário.
export function ErrorBlock({ message, onRetry, error }) {
  if (error?.detalhes?.limite_atingido) {
    return <PlanoBloqueado mensagem={message} />
  }
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-3">{message || 'Erro ao carregar dados.'}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary text-xs">Tentar novamente</button>
        )}
      </div>
    </div>
  )
}

// ── PlanoBloqueado ────────────────────────────────────────────────────────────
export function PlanoBloqueado({ mensagem }) {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center max-w-sm px-6">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <Zap size={20} className="text-amber-500" />
        </div>
        <p className="text-sm font-medium text-gray-800 mb-1.5">Recurso não disponível no seu plano</p>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed">{mensagem || 'Este recurso exige um plano superior.'}</p>
        <a href="/planos" className="btn-primary text-xs inline-block">Ver planos</a>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={32} className="text-gray-200 mb-3" />}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, error, children, required }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-600 mb-2">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, description, danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-5">{description}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`btn-primary flex items-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          {loading && <Spinner size={13} className="text-white" />}
          Confirmar
        </button>
      </div>
    </Modal>
  )
}

// ── Tags / Etiquetas ──────────────────────────────────────────────────────────

/**
 * Exibe as tags de um cliente/processo como badges coloridos.
 * Apenas leitura — usar TagPicker para editar.
 */
export function TagBadges({ tags = [], size = 'xs' }) {
  if (!tags?.length) return null
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map(t => (
        <span key={t.id}
          className={`inline-flex items-center gap-1 rounded-full font-medium ${size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
          style={{ backgroundColor: `${t.cor}1A`, color: t.cor }}
        >
          {t.icone && <span>{t.icone}</span>}
          {t.nome}
        </span>
      ))}
    </div>
  )
}

/**
 * Popover para atribuir/remover tags de uma entidade (cliente ou processo).
 * `todasTags` é a lista completa de tags do escritório; `tagsAtuais` as já atribuídas.
 * `onToggle(tag, atribuir)` é chamado a cada clique — quem usa decide a chamada de API.
 */
export function TagPicker({ todasTags = [], tagsAtuais = [], onToggle, onCriarNova, trigger }) {
  const [open, setOpen] = useState(false)
  const idsAtuais = new Set(tagsAtuais.map(t => t.id))

  return (
    <div className="relative inline-block">
      <div onClick={() => setOpen(v => !v)}>
        {trigger || (
          <button type="button" className="btn-ghost text-xs px-2 py-1 text-gray-400 hover:text-gray-600">
            + Tag
          </button>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white rounded-xl border border-gray-100 shadow-lg p-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide px-2 py-1">Etiquetas</p>
            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {todasTags.length === 0 && (
                <p className="text-xs text-gray-400 px-2 py-2">Nenhuma tag criada ainda.</p>
              )}
              {todasTags.map(t => {
                const ativa = idsAtuais.has(t.id)
                return (
                  <button key={t.id} type="button"
                    onClick={() => onToggle(t, !ativa)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.cor }} />
                    <span className="text-xs text-gray-700 flex-1 truncate">{t.icone ? `${t.icone} ` : ''}{t.nome}</span>
                    {ativa && <CheckCircle size={13} className="text-brand-600 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
            {onCriarNova && (
              <button type="button" onClick={() => { setOpen(false); onCriarNova() }}
                className="w-full text-left px-2 py-1.5 mt-1 border-t border-gray-50 text-xs text-brand-600 hover:bg-brand-50 rounded-lg">
                + Criar nova tag
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
