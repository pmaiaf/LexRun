import { useState, useEffect, useRef } from 'react'
import { Upload, Shield, Palette, Building2, Bell, Users, Plus, Image, X, Plug, CheckCircle2, ExternalLink, Loader2, Sparkles, MessageCircle, Clock } from 'lucide-react'
import { useApi, useAction } from '../hooks/useApi.js'
import { escritorioService, documentosService, automacoesService, iaDocumentosService } from '../services/api.js'
import { LoadingScreen, ErrorBlock, Modal, FormField, useToast } from '../components/ui/index.jsx'

const TABS = ['Escritório', 'White-label', 'Integrações', 'Usuários', 'Notificações', 'Logs de auditoria']

// ── Componente isolado para cada toggle de notificação (corrige Hook em .map) ──
function NotifToggle({ label, defaultValue }) {
  const [on, setOn] = useState(defaultValue)
  return (
    <div className="flex items-center justify-between py-0.5">
      <p className="text-sm text-gray-700">{label}</p>
      <button
        type="button"
        onClick={() => setOn(v => !v)}
        aria-pressed={on}
        className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${on ? 'bg-brand-800' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ── Aba de Integrações — conexão Mercado Pago em um clique ────────────────────
function IntegracoesTab() {
  const toast = useToast()
  const { data: status, loading: lStatus, refetch: refetchStatus } = useApi(() => automacoesService.statusMercadoPago(), [])
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [conectando, setConectando] = useState(false)
  const [iniciandoOAuth, setIniciandoOAuth] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const [oauthIndisponivel, setOauthIndisponivel] = useState(false)

  // Trata o retorno do redirect do Mercado Pago (?mp_conectado=true ou ?mp_erro=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mp_conectado') === 'true') {
      toast.success('Conta Mercado Pago integrada com sucesso!')
      refetchStatus()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('mp_erro')) {
      const motivo = params.get('mp_erro') === 'autorizacao_negada'
        ? 'Autorização cancelada no Mercado Pago.'
        : 'Não foi possível concluir a integração. Tente novamente.'
      toast.error(motivo)
      window.history.replaceState({}, '', window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Botão único: pede ao back-end a URL de autorização e redireciona o navegador.
  // O usuário autoriza no próprio site do Mercado Pago e volta já conectado —
  // nenhuma chave é copiada ou colada manualmente.
  async function handleIntegrarConta() {
    setIniciandoOAuth(true)
    try {
      const res = await automacoesService.iniciarOAuthMercadoPago()
      if (res.oauth_disponivel === false) {
        setOauthIndisponivel(true)
        setShowManual(true)
        toast.info('Integração automática indisponível neste servidor — preencha o Access Token manualmente abaixo.')
        return
      }
      window.location.href = res.url
    } catch (err) {
      // Erro real de rede/servidor (diferente do caso "OAuth não configurado",
      // que agora retorna 200 com oauth_disponivel:false e não cai aqui).
      setOauthIndisponivel(true)
      setShowManual(true)
      toast.error(err.message || 'Não foi possível iniciar a integração automática.')
    } finally {
      setIniciandoOAuth(false)
    }
  }

  async function handleConectarManual(e) {
    e.preventDefault()
    if (!token.trim()) { toast.error('Cole o Access Token do Mercado Pago.'); return }
    setConectando(true)
    try {
      const res = await automacoesService.conectarMercadoPago(token.trim())
      toast.success(`Conectado à conta de ${res.conta?.nome || 'Mercado Pago'} com sucesso!`)
      setToken('')
      refetchStatus()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConectando(false)
    }
  }

  async function handleDesconectar() {
    setDesconectando(true)
    try {
      await automacoesService.desconectarMercadoPago()
      toast.success('Mercado Pago desconectado.')
      refetchStatus()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDesconectando(false)
    }
  }

  if (lStatus) return <div className="max-w-lg"><div className="card p-6"><div className="h-24 bg-gray-50 rounded-xl animate-pulse"/></div></div>

  return (
    <div className="max-w-lg space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Plug size={15} className="text-brand-700"/>
          <p className="text-sm font-medium text-gray-800">Mercado Pago</p>
          {status?.conectado && (
            <span className="badge badge-green text-[10px] ml-auto flex items-center gap-1">
              <CheckCircle2 size={10}/> Conectado
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Conecte sua conta para gerar Pix, Boleto e Checkout automaticamente ao criar cobranças.
          O dinheiro cai direto na sua conta Mercado Pago — o LexRun nunca intermedia valores.
        </p>

        {status?.conectado ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-600 flex-shrink-0"/>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Integração ativa</p>
                <p className="text-xs text-green-600">
                  Conectado {status.mp_conectado_em ? `em ${new Date(status.mp_conectado_em).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>
            </div>
            <button onClick={handleDesconectar} disabled={desconectando}
              className="btn-secondary text-xs text-red-500 hover:bg-red-50">
              {desconectando ? 'Desconectando...' : 'Desconectar conta'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Botão único — fluxo principal */}
            <button onClick={handleIntegrarConta} disabled={iniciandoOAuth}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
              {iniciandoOAuth
                ? <Loader2 size={15} className="animate-spin"/>
                : <Plug size={15}/>
              }
              {iniciandoOAuth ? 'Abrindo Mercado Pago...' : 'Integrar conta'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Você será levado ao site do Mercado Pago para autorizar — não é preciso copiar nenhuma chave.
            </p>

            {/* Fallback manual — só aparece se o OAuth automático não estiver disponível
                ou se o usuário pedir explicitamente */}
            {!showManual ? (
              <button onClick={() => setShowManual(true)} className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center">
                Prefiro conectar manualmente com um Access Token
              </button>
            ) : (
              <div className="pt-2 border-t border-gray-100">
                {oauthIndisponivel && (
                  <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 mb-3">
                    A integração automática não está configurada neste servidor. Use a conexão manual abaixo.
                  </div>
                )}
                <form onSubmit={handleConectarManual} className="space-y-4">
                  <FormField label="Access Token de Produção" required>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        className="input pr-10 font-mono text-xs"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="APP_USR-0000000000000000-000000-..."
                        required
                      />
                      <button type="button" onClick={() => setShowToken(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                        {showToken ? 'ocultar' : 'mostrar'}
                      </button>
                    </div>
                  </FormField>
                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                    <p className="font-medium mb-1">Onde encontrar seu Access Token:</p>
                    <p>Painel do Mercado Pago → Seu negócio → Configurações → Credenciais → Credenciais de produção.</p>
                    <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-800 font-medium mt-1.5 hover:underline">
                      Abrir painel do Mercado Pago <ExternalLink size={10}/>
                    </a>
                  </div>
                  <button type="submit" disabled={conectando} className="btn-secondary w-full flex items-center justify-center gap-2">
                    {conectando && <Loader2 size={13} className="animate-spin"/>}
                    Conectar manualmente
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-5 bg-gray-50">
        <p className="text-xs font-medium text-gray-700 mb-2">Como funciona</p>
        <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
          <li>Clique em "Integrar conta" e autorize no site do Mercado Pago.</li>
          <li>Ao criar uma cobrança no módulo Financeiro, clique em "Gerar via Mercado Pago".</li>
          <li>O sistema gera Pix, Boleto e link de Checkout automaticamente.</li>
          <li>Um e-mail com sua logo é enviado ao cliente com todas as opções de pagamento.</li>
          <li>Quando o cliente paga, o status é atualizado automaticamente no LexRun.</li>
        </ol>
      </div>

      <IADocumentosCard />
      <WhatsAppCard />
    </div>
  )
}

// ── IA de Documentos — provedor plugável (padrão da plataforma ou chave própria) ──
function IADocumentosCard() {
  const toast = useToast()
  const { data: status, loading, refetch } = useApi(() => iaDocumentosService.status(), [])
  const [provedor, setProvedor] = useState('padrao')
  const [apiKey,    setApiKey]    = useState('')
  const [modelo,    setModelo]    = useState('')
  const [salvando,  setSalvando]  = useState(false)

  useEffect(() => { if (status?.ia_provedor) setProvedor(status.ia_provedor) }, [status?.ia_provedor])

  async function handleSalvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await iaDocumentosService.configurar({ provedor, api_key: apiKey || undefined, modelo: modelo || undefined })
      toast.success('Configuração de IA salva!')
      setApiKey('')
      refetch()
    } catch (err) { toast.error(err.message) }
    finally { setSalvando(false) }
  }

  if (loading) return <div className="max-w-lg card p-6"><div className="h-20 bg-gray-50 rounded-xl animate-pulse"/></div>

  return (
    <div className="max-w-lg card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} className="text-brand-700"/>
        <p className="text-sm font-medium text-gray-800">IA de Documentos</p>
        {status?.ia_provedor && status.ia_provedor !== 'padrao' && (
          <span className="badge badge-green text-[10px] ml-auto flex items-center gap-1"><CheckCircle2 size={10}/> Chave própria</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Gere peças simples, petições e procurações com IA. Use a chave padrão do LexRun (incluída no plano)
        ou conecte sua própria chave OpenAI/Anthropic.
      </p>
      <form onSubmit={handleSalvar} className="space-y-3">
        <FormField label="Provedor">
          <select className="input" value={provedor} onChange={e => setProvedor(e.target.value)}>
            <option value="padrao">Padrão do LexRun (incluso no plano)</option>
            <option value="anthropic">Anthropic (minha própria chave)</option>
            <option value="openai">OpenAI (minha própria chave)</option>
          </select>
        </FormField>
        {provedor !== 'padrao' && (
          <>
            <FormField label="Chave de API" required>
              <input type="password" className="input font-mono text-xs" value={apiKey}
                onChange={e => setApiKey(e.target.value)} placeholder="sk-..." required/>
            </FormField>
            <FormField label="Modelo (opcional)">
              <input className="input text-xs" value={modelo} onChange={e => setModelo(e.target.value)}
                placeholder={provedor === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-6'}/>
            </FormField>
          </>
        )}
        <button type="submit" disabled={salvando} className="btn-primary text-sm">
          {salvando ? 'Salvando...' : 'Salvar configuração'}
        </button>
      </form>
    </div>
  )
}

// WhatsApp foi marcado como "em desenvolvimento" — decisão de produto para
// não depender de plataforma de terceiro paga até a formalização do CNPJ
// (ver decisão registrada em sessões anteriores). O card abaixo é só
// informativo; a configuração funcional (Z-API/Twilio/webhook) foi
// desativada da interface, mesmo que o código de backend ainda exista.
function WhatsAppCard() {
  return (
    <div className="max-w-lg card p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={15} className="text-gray-400"/>
        <p className="text-sm font-medium text-gray-800">WhatsApp</p>
        <span className="badge text-[10px] ml-auto flex items-center gap-1 bg-amber-50 text-amber-600">
          <Clock size={10}/> Em desenvolvimento
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        O envio de documentos por WhatsApp está em desenvolvimento e será liberado em breve.
        Por enquanto, use o envio por e-mail no Gerador de IA.
      </p>
    </div>
  )
}

const NOTIFICACOES = [
  ['Alerta de prazo 24h antes',         true],
  ['Alerta de prazo 48h antes',         true],
  ['Novo documento recebido',           true],
  ['Cobrança vencida',                  true],
  ['Novo cliente cadastrado',           false],
  ['Resumo semanal por e-mail',         true],
  ['Processo movido no Kanban',         false],
  ['Cobrança paga pelo cliente',        true],
]

export default function ConfiguracoesPage() {
  const toast    = useToast()
  const logoRef  = useRef(null)
  // Abre a aba Integrações automaticamente se o usuário acabou de voltar
  // do fluxo de autorização do Mercado Pago (?mp_conectado / ?mp_erro)
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return (params.get('mp_conectado') || params.get('mp_erro')) ? 'Integrações' : 'Escritório'
  })
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile]       = useState(null)
  const [modalUser, setModalUser]     = useState(false)
  const [userForm, setUserForm]       = useState({ nome:'', email:'', senha:'', cargo:'estagiario' })
  const [editUser, setEditUser]       = useState(null)
  const [portalSenhaForm, setPortalSenhaForm] = useState({ atual:'', nova:'', confirma:'' })

  const { data: perfil,   loading: lp, error: ep, refetch: rp } = useApi(() => escritorioService.perfil(), [])
  const { data: usuarios, loading: lu, refetch: ru }             = useApi(() => escritorioService.usuarios(), [])
  const { data: logs,     loading: ll }                          = useApi(() => escritorioService.auditLogs({ limit: 30 }), [])

  useEffect(() => {
    if (!perfil) return
    setForm({
      nome:        perfil.nome        || '',
      oab:         perfil.oab         || '',
      email:       perfil.email       || '',
      telefone:    perfil.telefone    || '',
      cep:         perfil.cep         || '',
      endereco:    perfil.endereco    || '',
      cor_primaria:perfil.cor_primaria|| '#1B2E4B',
      cor_acento:  perfil.cor_acento  || '#0EA5A0',
    })
    if (perfil.logo_url) setLogoPreview(perfil.logo_url)
  }, [perfil])

  async function handleSalvarPerfil(e) {
    e.preventDefault(); setSaving(true)
    try {
      await escritorioService.atualizarPerfil(form)
      toast.success('Perfil atualizado com sucesso!')
      rp()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleSalvarWhiteLabel(e) {
    e.preventDefault(); setSaving(true)
    try {
      // Upload de logo se houver arquivo novo
      if (logoFile) {
        const fd = new FormData()
        fd.append('arquivo', logoFile)
        await escritorioService.uploadLogo(fd)
        setLogoFile(null)
      }
      await escritorioService.atualizarPerfil({
        cor_primaria: form.cor_primaria,
        cor_acento:   form.cor_acento,
      })
      toast.success('Identidade visual aplicada!')
      rp()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo deve ter menos de 2 MB.'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleCriarUsuario(e) {
    e.preventDefault(); setSaving(true)
    try {
      await escritorioService.criarUsuario(userForm)
      toast.success('Usuário criado com sucesso!')
      setModalUser(false)
      setUserForm({ nome:'', email:'', senha:'', cargo:'estagiario' })
      ru()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleAtualizarUsuario(e) {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { nome: editUser.nome, cargo: editUser.cargo }
      if (editUser.novaSenha) {
        if (editUser.novaSenha.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres.'); return }
        payload.senha = editUser.novaSenha
      }
      await escritorioService.atualizarUsuario(editUser.id, payload)
      toast.success('Usuário atualizado!')
      setEditUser(null)
      ru()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleToggleAtivo(u) {
    try {
      await escritorioService.atualizarUsuario(u.id, { ativo: !u.ativo })
      toast.success(`Usuário ${u.ativo ? 'desativado' : 'ativado'}.`)
      ru()
    } catch (err) { toast.error(err.message) }
  }

  if (lp) return <LoadingScreen />
  if (ep) return <ErrorBlock message={ep} onRetry={rp} />

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Personalize o sistema para o seu escritório</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${tab===t?'bg-white text-gray-900 font-medium shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── ESCRITÓRIO ─────────────────────────────────────────────────────── */}
      {tab === 'Escritório' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={15} className="text-brand-700" />
              <p className="text-sm font-medium text-gray-800">Dados do escritório</p>
            </div>
            <form onSubmit={handleSalvarPerfil} className="space-y-4">
              <FormField label="Nome do escritório" required>
                <input className="input" value={form.nome||''} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required />
              </FormField>
              <FormField label="Número OAB">
                <input className="input" value={form.oab||''} onChange={e=>setForm(f=>({...f,oab:e.target.value}))} placeholder="OAB/SP 000.000" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="E-mail" required>
                  <input type="email" className="input" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
                </FormField>
                <FormField label="Telefone">
                  <input className="input" value={form.telefone||''} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))} placeholder="(11) 3000-0000" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="CEP">
                  <input className="input" value={form.cep||''} onChange={e=>setForm(f=>({...f,cep:e.target.value}))} placeholder="00000-000" />
                </FormField>
                <FormField label="Endereço">
                  <input className="input" value={form.endereco||''} onChange={e=>setForm(f=>({...f,endereco:e.target.value}))} />
                </FormField>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── WHITE-LABEL ────────────────────────────────────────────────────── */}
      {tab === 'White-label' && (
        <div className="max-w-lg space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Palette size={15} className="text-brand-700" />
              <p className="text-sm font-medium text-gray-800">Identidade visual do portal</p>
            </div>
            <form onSubmit={handleSalvarWhiteLabel} className="space-y-5">

              {/* Upload de logo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Logomarca do escritório
                  <span className="text-gray-400 font-normal ml-1">(exibida no portal do cliente)</span>
                </label>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="relative w-fit">
                    <img src={logoPreview} alt="Logo" className="h-16 object-contain border border-gray-100 rounded-xl p-2 bg-white" />
                    <button
                      type="button"
                      onClick={() => { setLogoPreview(null); setLogoFile(null) }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors"
                  >
                    <Image size={20} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">Clique para enviar sua logo</p>
                    <p className="text-[10px] text-gray-300 mt-1">PNG, SVG, JPG ou WebP · máx. 2 MB</p>
                  </button>
                )}
                {logoFile && (
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                    ✓ {logoFile.name} selecionada — salve para aplicar
                  </p>
                )}
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cor primária">
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={form.cor_primaria||'#1B2E4B'}
                      onChange={e=>setForm(f=>({...f,cor_primaria:e.target.value}))}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 bg-white"
                    />
                    <input
                      className="input font-mono text-xs" value={form.cor_primaria||''}
                      onChange={e=>setForm(f=>({...f,cor_primaria:e.target.value}))}
                      maxLength={7} placeholder="#1B2E4B"
                    />
                  </div>
                </FormField>
                <FormField label="Cor de acento">
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={form.cor_acento||'#0EA5A0'}
                      onChange={e=>setForm(f=>({...f,cor_acento:e.target.value}))}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 bg-white"
                    />
                    <input
                      className="input font-mono text-xs" value={form.cor_acento||''}
                      onChange={e=>setForm(f=>({...f,cor_acento:e.target.value}))}
                      maxLength={7} placeholder="#0EA5A0"
                    />
                  </div>
                </FormField>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Pré-visualização do portal</p>
                <div className="rounded-lg overflow-hidden border border-gray-200" style={{ background: form.cor_primaria || '#1B2E4B' }}>
                  <div className="p-3 flex items-center gap-2.5">
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="h-7 object-contain" />
                      : (
                        <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".9"/>
                            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
                            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
                            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".25"/>
                          </svg>
                        </div>
                      )
                    }
                    <span className="text-white text-sm font-semibold">{form.nome || 'Seu Escritório'}</span>
                    <span className="ml-auto text-xs px-3 py-1 rounded-full text-white font-medium"
                      style={{ background: form.cor_acento || '#0EA5A0' }}>
                      Portal
                    </span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Aplicando...' : 'Salvar identidade visual'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── INTEGRAÇÕES ────────────────────────────────────────────────────── */}
      {tab === 'Integrações' && <IntegracoesTab />}

      {/* ── USUÁRIOS ───────────────────────────────────────────────────────── */}
      {tab === 'Usuários' && (
        <div className="max-w-2xl">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-brand-700" />
                <p className="text-sm font-medium text-gray-800">Usuários do escritório</p>
              </div>
              <button onClick={() => setModalUser(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus size={12} /> Adicionar usuário
              </button>
            </div>
            {lu
              ? <div className="p-5 space-y-2">{[1,2].map(i=><div key={i} className="h-12 bg-gray-50 rounded animate-pulse"/>)}</div>
              : <div className="divide-y divide-gray-50">
                  {(usuarios || []).map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 text-xs font-semibold flex-shrink-0">
                        {u.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{u.nome}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <span className="badge badge-gray capitalize text-[10px]">{u.cargo}</span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.ativo ? 'bg-green-500' : 'bg-gray-200'}`} title={u.ativo ? 'Ativo' : 'Inativo'} />
                      <button onClick={() => setEditUser({ ...u, novaSenha: '' })} className="btn-ghost text-xs px-2 py-1 text-gray-500">Editar</button>
                      <button onClick={() => handleToggleAtivo(u)} className={`btn-ghost text-xs px-2 py-1 ${u.ativo ? 'text-red-400 hover:text-red-600' : 'text-green-600'}`}>
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  ))}
                  {!usuarios?.length && <p className="text-center text-xs text-gray-400 py-8">Nenhum usuário cadastrado</p>}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── NOTIFICAÇÕES ───────────────────────────────────────────────────── */}
      {tab === 'Notificações' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell size={15} className="text-brand-700" />
              <p className="text-sm font-medium text-gray-800">Preferências de notificação</p>
            </div>
            <div className="space-y-4">
              {NOTIFICACOES.map(([label, def]) => (
                <NotifToggle key={label} label={label} defaultValue={def} />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50 flex justify-end">
              <button onClick={() => toast.success('Preferências salvas!')} className="btn-primary text-xs px-4 py-2">
                Salvar preferências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGS ───────────────────────────────────────────────────────────── */}
      {tab === 'Logs de auditoria' && (
        <div className="max-w-2xl">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Shield size={14} className="text-brand-700" />
              <p className="text-sm font-medium text-gray-800">Log de auditoria</p>
            </div>
            {ll
              ? <div className="p-5"><div className="h-10 bg-gray-50 rounded animate-pulse" /></div>
              : <div className="divide-y divide-gray-50">
                  {(logs || []).map(log => (
                    <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <Shield size={12} className="text-brand-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800">{log.acao}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {log.tabela && <span className="font-mono bg-gray-100 px-1 rounded mr-1">{log.tabela}</span>}
                          IP: {log.ip || '—'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-600">{log.usuario_nome || 'Sistema'}</p>
                        <p className="text-[10px] text-gray-400">{new Date(log.criado_em).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                  {!logs?.length && <p className="text-center text-xs text-gray-400 py-8">Nenhum log encontrado</p>}
                </div>
            }
          </div>
        </div>
      )}

      {/* Modal criar usuário */}
      <Modal open={modalUser} onClose={() => setModalUser(false)} title="Adicionar usuário" size="sm">
        <form onSubmit={handleCriarUsuario} className="space-y-4">
          <FormField label="Nome completo" required>
            <input className="input" value={userForm.nome} onChange={e=>setUserForm(f=>({...f,nome:e.target.value}))} required />
          </FormField>
          <FormField label="E-mail" required>
            <input type="email" className="input" value={userForm.email} onChange={e=>setUserForm(f=>({...f,email:e.target.value}))} required />
          </FormField>
          <FormField label="Senha provisória" required>
            <input type="password" className="input" value={userForm.senha}
              onChange={e=>setUserForm(f=>({...f,senha:e.target.value}))} required minLength={6}
              placeholder="Mínimo 6 caracteres" />
          </FormField>
          <FormField label="Cargo">
            <select className="input" value={userForm.cargo} onChange={e=>setUserForm(f=>({...f,cargo:e.target.value}))}>
              <option value="estagiario">Estagiário</option>
              <option value="associado">Associado</option>
              <option value="socio">Sócio</option>
            </select>
          </FormField>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModalUser(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal editar usuário + redefinir senha */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar usuário" size="sm">
        {editUser && (
          <form onSubmit={handleAtualizarUsuario} className="space-y-4">
            <FormField label="Nome">
              <input className="input" value={editUser.nome}
                onChange={e=>setEditUser(u=>({...u,nome:e.target.value}))} required />
            </FormField>
            <FormField label="Cargo">
              <select className="input" value={editUser.cargo}
                onChange={e=>setEditUser(u=>({...u,cargo:e.target.value}))}>
                <option value="estagiario">Estagiário</option>
                <option value="associado">Associado</option>
                <option value="socio">Sócio</option>
              </select>
            </FormField>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-3">Nova senha (deixe em branco para não alterar)</p>
              <FormField label="Nova senha">
                <input type="password" className="input" value={editUser.novaSenha || ''}
                  onChange={e=>setEditUser(u=>({...u,novaSenha:e.target.value}))}
                  placeholder="Mínimo 6 caracteres" minLength={editUser.novaSenha ? 6 : 0} />
              </FormField>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
