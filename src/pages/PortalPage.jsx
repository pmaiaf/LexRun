import { useState } from 'react'
import { CheckCircle, Clock, Circle, ExternalLink, Upload, FileText, Plus, Lock } from 'lucide-react'
import { useApi, useAction } from '../hooks/useApi.js'
import { clientesService, documentosService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast, EmptyState } from '../components/ui/index.jsx'
import { avatarInitials, avatarColor } from '../utils/helpers.js'

const TL_ICON = {
  done:    <CheckCircle size={14} className="text-green-600" />,
  current: <Clock       size={14} className="text-blue-600" />,
  next:    <Circle      size={14} className="text-gray-300" />,
}

export default function PortalPage() {
  const toast = useToast()
  const { data, loading, error, refetch } = useApi(() => clientesService.listar({ limit: 100 }), [])
  const [selecionado, setSelecionado] = useState(null)
  const [modalPortal, setModalPortal] = useState(false)
  const [modalUpload, setModalUpload] = useState(false)
  const [file,  setFile]  = useState(null)
  const [saving, setSaving] = useState(false)
  const { execute } = useAction()

  const { data: timeline } = useApi(
    () => selecionado ? clientesService.processos(selecionado.id).then(async procs => {
      if (!procs[0]) return []
      const { processosService: ps } = await import('../services/api.js')
      return ps.timeline(procs[0].id)
    }) : Promise.resolve([]),
    [selecionado?.id]
  )

  const { data: docs, refetch: refetchDocs } = useApi(
    () => selecionado ? documentosService.listar({ cliente_id: selecionado.id }) : Promise.resolve([]),
    [selecionado?.id]
  )

  const clientes = data?.data || []

  async function handleAtivarPortal(e) {
    e.preventDefault(); setSaving(true)
    try {
      await clientesService.ativarPortal(selecionado.id)
      toast.success('Portal ativado! E-mail de boas-vindas enviado com os dados de acesso.')
      setModalPortal(false); refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      fd.append('cliente_id', selecionado.id)
      fd.append('visivel_cliente', 'true')
      await documentosService.upload(fd)
      toast.success('Documento enviado!')
      setModalUpload(false); setFile(null); refetchDocs()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorBlock message={error} onRetry={refetch} />

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Portal do Cliente</h1>
          <p className="text-sm text-gray-500">Gerencie acesso e acompanhe a visão do cliente</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5"><Plus size={14} />Convidar cliente</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Lista de clientes */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50"><p className="text-sm font-medium text-gray-800">Clientes</p></div>
          {clientes.length === 0
            ? <EmptyState icon={FileText} title="Nenhum cliente cadastrado" />
            : <div className="divide-y divide-gray-50">
                {clientes.map(c => (
                  <div key={c.id} onClick={() => setSelecionado(c)}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selecionado?.id===c.id?'bg-brand-50':'hover:bg-gray-50'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${avatarColor(c.id)}`}>
                      {avatarInitials(c.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.nome}</p>
                      <p className="text-xs text-gray-400">{c.total_processos||0} processo{c.total_processos!==1?'s':''} · {c.portal_ativo?'Portal ativo':'Sem acesso'}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className={`w-2 h-2 rounded-full ml-auto ${c.portal_ativo?'bg-green-500':'bg-gray-200'}`} />
                      <p className="text-[10px] text-gray-400 mt-1">{c.ultimo_acesso||'—'}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Painel de detalhe */}
        {selecionado ? (
          <div className="lg:col-span-3 space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium ${avatarColor(selecionado.id)}`}>
                  {avatarInitials(selecionado.nome)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selecionado.nome}</p>
                  <p className="text-xs text-gray-400">{selecionado.email} · {selecionado.telefone}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  {!selecionado.portal_ativo
                    ? <button onClick={() => setModalPortal(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Lock size={11}/>Ativar portal</button>
                    : <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"><ExternalLink size={11}/>Ver portal</button>
                  }
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Processos',selecionado.total_processos||0],['CPF/CNPJ',selecionado.cpf_cnpj||'—'],['Tipo',selecionado.tipo]].map(([k,v])=>(
                  <div key={k} className="bg-gray-50 rounded-lg py-2">
                    <p className="text-xs text-gray-400">{k}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {Array.isArray(timeline) && timeline.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-800">Linha do tempo processual</p>
                  <span className="badge badge-blue text-[10px]">Visão do cliente</span>
                </div>
                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="mt-0.5">{TL_ICON[item.status]}</div>
                        {i < timeline.length-1 && <div className={`w-px flex-1 mt-1 ${item.status==='done'?'bg-green-200':'bg-gray-100'}`} style={{minHeight:24}} />}
                      </div>
                      <div className="pb-2">
                        <p className={`text-sm font-medium ${item.status==='next'?'text-gray-400':'text-gray-800'}`}>{item.titulo}</p>
                        {item.data_evento && <p className="text-xs text-gray-400 mt-0.5">{new Date(item.data_evento).toLocaleDateString('pt-BR')}</p>}
                        <p className={`text-xs mt-1 ${item.status==='next'?'text-gray-300':'text-gray-500'}`}>{item.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-800">Documentos</p>
                <button onClick={() => setModalUpload(true)} className="btn-ghost text-xs flex items-center gap-1"><Upload size={12}/>Enviar</button>
              </div>
              {!docs || docs.length === 0
                ? <p className="text-xs text-gray-400 text-center py-4">Nenhum documento ainda</p>
                : <div className="space-y-2">
                    {docs.map(doc => (
                      <a key={doc.id} href={documentosService.download(doc.id)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileText size={16} className="text-brand-700 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{doc.nome}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
              }
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 flex items-center justify-center">
            <p className="text-sm text-gray-400">Selecione um cliente para ver os detalhes</p>
          </div>
        )}
      </div>

      <Modal open={modalPortal} onClose={() => setModalPortal(false)} title={`Ativar portal — ${selecionado?.nome}`} size="sm">
        <form onSubmit={handleAtivarPortal} className="space-y-4">
          <p className="text-sm text-gray-500">
            O sistema vai gerar uma senha de acesso automaticamente e enviar um e-mail de boas-vindas
            para <strong>{selecionado?.email || 'o cliente'}</strong> com os dados de login.
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={()=>setModalPortal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving?'Ativando...':'Confirmar Ativação'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modalUpload} onClose={() => setModalUpload(false)} title="Enviar documento" size="sm">
        <form onSubmit={handleUpload} className="space-y-4">
          <FormField label="Arquivo">
            <input type="file" className="input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e=>setFile(e.target.files[0])} required />
          </FormField>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={()=>setModalUpload(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving||!file} className="btn-primary">{saving?'Enviando...':'Enviar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
