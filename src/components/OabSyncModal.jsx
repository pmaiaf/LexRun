import { useState, useEffect } from 'react'
import { Scale, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { oabService } from '../services/api.js'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

/**
 * Modal obrigatório de OAB (primeiro acesso). Bloqueia até o advogado informar
 * a OAB e sincronizar. Depois de disparar, acompanha o progresso por polling.
 */
export default function OabSyncModal({ onConcluir, onPular }) {
  const [oab, setOab] = useState('')
  const [uf, setUf] = useState('')
  const [fase, setFase] = useState('form') // form | sincronizando | concluido | erro
  const [resumo, setResumo] = useState(null)
  const [erro, setErro] = useState('')

  // polling do status enquanto sincroniza
  useEffect(() => {
    if (fase !== 'sincronizando') return
    const t = setInterval(async () => {
      try {
        const r = await oabService.status()
        const s = r.sincronizacao
        if (s?.status === 'concluido') {
          setResumo(s); setFase('concluido'); clearInterval(t)
        } else if (s?.status === 'erro') {
          setErro(s.erro || 'Falha na sincronização.'); setFase('erro'); clearInterval(t)
        }
      } catch (_) { /* segue tentando */ }
    }, 3000)
    return () => clearInterval(t)
  }, [fase])

  async function sincronizar() {
    setErro('')
    const num = oab.replace(/\D/g, '')
    if (!num || uf.length !== 2) { setErro('Informe o número da OAB e a UF.'); return }
    try {
      await oabService.sincronizar(num, uf)
      setFase('sincronizando')
    } catch (e) { setErro(e.message || 'Não foi possível iniciar a sincronização.') }
  }

  return (
    <div className="fixed inset-0 z-50 bg-brand-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
          <Scale size={20} className="text-brand-700" />
        </div>

        {fase === 'form' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Vincule sua OAB</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Para começar, informe seu número de OAB. Vamos buscar automaticamente todos os processos vinculados a você — os ativos entram prontos, e os inativos aparecem marcados como tal.
            </p>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400">Número da OAB</label>
                <input className="input" value={oab} onChange={e => setOab(e.target.value)} placeholder="123456" autoFocus />
              </div>
              <div className="w-24">
                <label className="text-xs text-gray-400">UF</label>
                <select className="input" value={uf} onChange={e => setUf(e.target.value)}>
                  <option value="">—</option>
                  {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {erro && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> {erro}</p>}
            <button onClick={sincronizar} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
              <RefreshCw size={15} /> Sincronizar processos
            </button>
            <button onClick={() => (onPular || onConcluir)()} className="btn-ghost w-full text-sm mt-2 text-gray-500">
              Pular agora
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">Você pode vincular a OAB depois, quando quiser sincronizar seus processos.</p>
          </>
        )}

        {fase === 'sincronizando' && (
          <div className="text-center py-4">
            <Loader2 size={28} className="text-brand-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Sincronizando…</h2>
            <p className="text-sm text-gray-500 mt-1">Estamos buscando seus processos nos tribunais. Isso pode levar alguns minutos — pode deixar aberto.</p>
          </div>
        )}

        {fase === 'concluido' && (
          <div className="text-center py-2">
            <CheckCircle2 size={28} className="text-green-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">Pronto!</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {resumo?.total_importados ?? 0} processos importados
              {resumo ? ` (${resumo.total_ativos} ativos · ${resumo.total_inativos} inativos)` : ''}.
              Novos processos vão aparecer automaticamente.
            </p>
            <button onClick={onConcluir} className="btn-primary w-full">Ir para o sistema</button>
          </div>
        )}

        {fase === 'erro' && (
          <div className="text-center py-2">
            <AlertTriangle size={26} className="text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">Não deu certo</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">{erro}</p>
            <button onClick={() => setFase('form')} className="btn-secondary w-full">Tentar novamente</button>
          </div>
        )}
      </div>
    </div>
  )
}
