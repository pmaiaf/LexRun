import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Modal, FormField, useToast } from './index.jsx'
import { tagsService } from '../../services/api.js'

const CORES_SUGERIDAS = ['#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#6B7280','#EC4899']

/**
 * Modal para criar/editar/remover as tags do escritório (catálogo global,
 * depois atribuídas individualmente a clientes ou processos via TagPicker).
 */
export default function TagsManagerModal({ open, onClose, tags, onChanged }) {
  const toast = useToast()
  const [novoNome, setNovoNome] = useState('')
  const [novaCor,  setNovaCor]  = useState(CORES_SUGERIDAS[0])
  const [novoIcone, setNovoIcone] = useState('')
  const [criando, setCriando] = useState(false)
  const [removendoId, setRemovendoId] = useState(null)

  async function handleCriar(e) {
    e.preventDefault()
    if (!novoNome.trim()) return
    setCriando(true)
    try {
      await tagsService.criar({ nome: novoNome.trim(), cor: novaCor, icone: novoIcone || null })
      toast.success('Tag criada!')
      setNovoNome(''); setNovoIcone('')
      onChanged?.()
    } catch (err) { toast.error(err.message) }
    finally { setCriando(false) }
  }

  async function handleRemover(tag) {
    setRemovendoId(tag.id)
    try {
      await tagsService.remover(tag.id)
      toast.success(`Tag "${tag.nome}" removida.`)
      onChanged?.()
    } catch (err) { toast.error(err.message) }
    finally { setRemovendoId(null) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gerenciar etiquetas" size="sm">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">Etiquetas do escritório</p>
          {(!tags || tags.length === 0) ? (
            <p className="text-xs text-gray-400 py-3">Nenhuma etiqueta criada ainda.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {tags.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.cor }} />
                  <span className="text-sm text-gray-700 flex-1">{t.icone ? `${t.icone} ` : ''}{t.nome}</span>
                  <button onClick={() => handleRemover(t)} disabled={removendoId === t.id}
                    className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleCriar} className="space-y-3 pt-3 border-t border-gray-100">
          <FormField label="Nova etiqueta" required>
            <div className="flex gap-2">
              <input className="input flex-shrink-0 w-12 text-center" placeholder="🏷️" maxLength={2}
                value={novoIcone} onChange={e => setNovoIcone(e.target.value)} />
              <input className="input flex-1" placeholder="Ex: Contrato fechado"
                value={novoNome} onChange={e => setNovoNome(e.target.value)} required />
            </div>
          </FormField>
          <div className="flex items-center gap-1.5">
            {CORES_SUGERIDAS.map(c => (
              <button key={c} type="button" onClick={() => setNovaCor(c)}
                className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform ${novaCor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button type="submit" disabled={criando} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
            {criando ? 'Criando...' : <><Plus size={14} /> Criar etiqueta</>}
          </button>
        </form>
      </div>
    </Modal>
  )
}
