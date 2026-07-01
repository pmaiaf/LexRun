const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1'

// ── Gestão de tokens ───────────────────────────────────────────────────────────
function getAccessToken()  { return localStorage.getItem('jf_access')  }
function getRefreshToken() { return localStorage.getItem('jf_refresh') }
function setTokens(access, refresh) {
  localStorage.setItem('jf_access',  access)
  if (refresh) localStorage.setItem('jf_refresh', refresh)
}
function clearTokens() {
  localStorage.removeItem('jf_access')
  localStorage.removeItem('jf_refresh')
  localStorage.removeItem('jf_user')
}

// ── Refresh token automático ───────────────────────────────────────────────────
let refreshPromise = null

async function tryRefresh() {
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken: getRefreshToken() }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken)
        return data.accessToken
      }
      throw new Error('Refresh falhou')
    })
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

// ── Fetch base ────────────────────────────────────────────────────────────────
async function request(path, options = {}, retry = true) {
  const token = getAccessToken()
  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData
      ? options.body
      : options.body ? JSON.stringify(options.body) : undefined,
  })

  // Token expirado → tenta refresh uma vez
  if (res.status === 401 && retry && getRefreshToken()) {
    try {
      await tryRefresh()
      return request(path, options, false)
    } catch {
      clearTokens()
      window.dispatchEvent(new Event('jf:logout'))
      throw new ApiError('Sessão expirada.', 401)
    }
  }

  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(data.erro || 'Erro desconhecido.', res.status, data)
  }

  return data
}

export class ApiError extends Error {
  constructor(message, status, detalhes) {
    super(message)
    this.status   = status
    this.detalhes = detalhes
  }
}

// ── Métodos HTTP ──────────────────────────────────────────────────────────────
const api = {
  get:    (path, opts)         => request(path, { method: 'GET',    ...opts }),
  post:   (path, body, opts)   => request(path, { method: 'POST',   body, ...opts }),
  patch:  (path, body, opts)   => request(path, { method: 'PATCH',  body, ...opts }),
  put:    (path, body, opts)   => request(path, { method: 'PUT',    body, ...opts }),
  delete: (path, opts)         => request(path, { method: 'DELETE', ...opts }),
  upload: (path, formData)     => request(path, { method: 'POST',   body: formData }),
}

export { api, setTokens, clearTokens, getAccessToken, getRefreshToken }

// ── Services por módulo ───────────────────────────────────────────────────────

export const authService = {
  login:   (email, senha)     => api.post('/auth/login', { email, senha }),
  refresh: (refreshToken)     => api.post('/auth/refresh', { refreshToken }),
  logout:  (refreshToken)     => api.post('/auth/logout', { refreshToken }),
  me:      ()                 => api.get('/auth/me'),
  register:(data)             => api.post('/auth/register', data),
  esqueciSenha:    (email)              => api.post('/auth/esqueci-senha', { email }),
  redefinirSenha:  (token, novaSenha)   => api.post('/auth/redefinir-senha', { token, novaSenha }),
}

export const processosService = {
  listar:           (params = {}) => api.get('/processos?' + new URLSearchParams(params)),
  buscar:           (id)          => api.get(`/processos/${id}`),
  criar:            (data)        => api.post('/processos', data),
  atualizar:        (id, data)    => api.patch(`/processos/${id}`, data),
  remover:          (id)          => api.delete(`/processos/${id}`),
  timeline:         (id)          => api.get(`/processos/${id}/timeline`),
  adicionarTimeline:(id, data)    => api.post(`/processos/${id}/timeline`, data),
  registrarHoras:   (id, data)    => api.post(`/processos/${id}/timesheet`, data),
  sincronizarDataJud:(id)         => api.post(`/processos/${id}/sincronizar-datajud`, {}),
  movimentacoes:    (id)          => api.get(`/processos/${id}/movimentacoes`),
  traduzirMov:      (id, movId)   => api.post(`/processos/${id}/movimentacoes/${movId}/traduzir`, {}),
  visibilidadeMov:  (id, movId, visivel) => api.patch(`/processos/${id}/movimentacoes/${movId}/visibilidade`, { visivel }),
}

export const clientesService = {
  listar:        (params = {}) => api.get('/clientes?' + new URLSearchParams(params)),
  buscar:        (id)          => api.get(`/clientes/${id}`),
  criar:         (data)        => api.post('/clientes', data),
  atualizar:     (id, data)    => api.patch(`/clientes/${id}`, data),
  remover:       (id)          => api.delete(`/clientes/${id}`),
  processos:     (id)          => api.get(`/clientes/${id}/processos`),
  ativarPortal:  (id)          => api.post(`/clientes/${id}/ativar-portal`, {}),
}

export const financeiroService = {
  dashboard:      (params = {}) => api.get('/financeiro/dashboard?' + new URLSearchParams(params)),
  cobrancas:      (params = {}) => api.get('/financeiro/cobrancas?' + new URLSearchParams(params)),
  criarCobranca:  (data)        => api.post('/financeiro/cobrancas', data),
  marcarPago:     (id)          => api.patch(`/financeiro/cobrancas/${id}/pagar`, {}),
  enviarLembrete: (id)          => api.post(`/financeiro/cobrancas/${id}/lembrete`, {}),
  lancamentos:    (params = {}) => api.get('/financeiro/lancamentos?' + new URLSearchParams(params)),
  criarLancamento:(data)        => api.post('/financeiro/lancamentos', data),
}

export const agendaService = {
  listar:   (params = {}) => api.get('/agenda?' + new URLSearchParams(params)),
  proximos: ()            => api.get('/agenda/proximos'),
  atividades:(params = {})=> api.get('/agenda/atividades?' + new URLSearchParams(params)),
  resumo:   ()            => api.get('/agenda/resumo'),
  criar:    (data)        => api.post('/agenda', data),
  atualizar:(id, data)    => api.patch(`/agenda/${id}`, data),
  remover:  (id)          => api.delete(`/agenda/${id}`),
}

export const documentosService = {
  listar:   (params = {}) => api.get('/documentos?' + new URLSearchParams(params)),
  upload:   (formData)    => api.upload('/documentos', formData),
  // Inclui o token como query string: o link é aberto via <a href> em nova aba,
  // onde não há como anexar o header Authorization.
  download: (id)          => `${BASE_URL}/documentos/${id}/download?token=${getAccessToken()}`,
  remover:  (id)          => api.delete(`/documentos/${id}`),
  pendentes:()            => api.get('/documentos/pendentes'),
  aprovar:  (id)          => api.post(`/documentos/${id}/aprovar`, {}),
  recusar:  (id, motivo)  => api.post(`/documentos/${id}/recusar`, { motivo }),
}

export const escritorioService = {
  perfil:          ()          => api.get('/escritorio/perfil'),
  atualizarPerfil: (data)      => api.patch('/escritorio/perfil', data),
  uploadLogo:      (formData)  => api.upload('/escritorio/logo', formData),
  usuarios:        ()          => api.get('/escritorio/usuarios'),
  criarUsuario:    (data)      => api.post('/escritorio/usuarios', data),
  atualizarUsuario:(id, data)  => api.patch(`/escritorio/usuarios/${id}`, data),
  auditLogs:       (p = {})    => api.get('/escritorio/audit-logs?' + new URLSearchParams(p)),
}

// ── Portal do cliente (auth separada) ────────────────────────────────────────
// Usa token próprio guardado em jf_portal_token
function getPortalToken() { return localStorage.getItem('jf_portal_token') }
function setPortalToken(t) { localStorage.setItem('jf_portal_token', t) }
function clearPortalToken() {
  localStorage.removeItem('jf_portal_token')
  localStorage.removeItem('jf_portal_cliente')
}

async function portalRequest(path, options = {}) {
  const token = getPortalToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new ApiError(data.erro || 'Erro.', res.status)
  return data
}

export const oabService = {
  status:      ()          => api.get('/oab/status'),
  sincronizar: (oab, uf)   => api.post('/oab/sincronizar', { oab, uf }),
}

export const calculosService = {
  listar:     ()              => api.get('/calculos'),
  tipos:      (area, subArea) => api.get(`/calculos/tipos?area=${encodeURIComponent(area || '')}&subArea=${encodeURIComponent(subArea || '')}`),
  estruturar: (payload)       => api.post('/calculos/estruturar', payload),
  criar:      (payload)       => api.post('/calculos', payload),
  calcular:   (id, estrutura) => api.post(`/calculos/${id}/calcular`, estrutura ? { estrutura } : {}),
}

async function portalUpload(path, formData) {
  const token = getPortalToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.erro || 'Erro ao enviar.', res.status)
  return data
}

export const portalService = {
  login:      (email, senha, escritorioSlug) =>
    portalRequest('/portal/login', { method: 'POST', body: { email, senha, escritorioSlug } }),
  me:         () => portalRequest('/portal/me'),
  processos:  () => portalRequest('/portal/processos'),
  processo:   (id) => portalRequest(`/portal/processos/${id}`),
  timeline:   (id) => portalRequest(`/portal/processos/${id}/timeline`),
  documentos: (processoId) => portalRequest(`/portal/documentos?processo_id=${processoId}`),
  enviarDocumento: (formData) => portalUpload('/portal/documentos', formData),
  cobrancas:  () => portalRequest('/portal/cobrancas'),
  agenda:     () => portalRequest('/portal/agenda'),
  esqueciSenha:   (email)             => api.post('/portal/esqueci-senha', { email }),
  redefinirSenha: (token, novaSenha)  => api.post('/portal/redefinir-senha', { token, novaSenha }),
  downloadDoc:(id) => `${BASE_URL}/portal/documentos/${id}/download?token=${getPortalToken()}`,
  setToken:   setPortalToken,
  clearToken: clearPortalToken,
  getCliente: () => { try { return JSON.parse(localStorage.getItem('jf_portal_cliente') || 'null') } catch { return null } },
  setCliente: (c) => localStorage.setItem('jf_portal_cliente', JSON.stringify(c)),
}

// ── Relatórios ────────────────────────────────────────────────────────────────
export const relatoriosService = {
  processos:  (params = {}) => api.get('/relatorios/processos?'  + new URLSearchParams(params)),
  financeiro: (params = {}) => api.get('/relatorios/financeiro?' + new URLSearchParams(params)),
  clientes:   (params = {}) => api.get('/relatorios/clientes?'   + new URLSearchParams(params)),
  timesheet:  (params = {}) => api.get('/relatorios/timesheet?'  + new URLSearchParams(params)),
}

// ── Automações ────────────────────────────────────────────────────────────────
export const automacoesService = {
  faturarHoras:        (processoId, data) => api.post(`/automacoes/processos/${processoId}/faturar-horas`, data),

  // Mercado Pago
  conectarMercadoPago:    (accessToken) => api.post('/automacoes/mercadopago/conectar', { access_token: accessToken }),
  desconectarMercadoPago: ()            => api.delete('/automacoes/mercadopago/desconectar'),
  statusMercadoPago:      ()            => api.get('/automacoes/mercadopago/status'),
  gerarCobrancaMercadoPago: (cobrancaId) => api.post(`/automacoes/cobrancas/${cobrancaId}/gerar-mercadopago`, {}),
  reenviarEmailCobranca:  (cobrancaId)   => api.post(`/automacoes/cobrancas/${cobrancaId}/reenviar-email`, {}),
  // Alternativa ao Mercado Pago — e-mail com dados de pagamento digitados manualmente
  enviarCobrancaManual:   (cobrancaId, dadosPagamento) => api.post(`/automacoes/cobrancas/${cobrancaId}/enviar-manual`, { dados_pagamento: dadosPagamento }),
  // Integração em um clique — retorna a URL de autorização do Mercado Pago
  iniciarOAuthMercadoPago: ()           => api.get('/automacoes/mercadopago/oauth/iniciar'),
}

// ── Tags / Etiquetas ──────────────────────────────────────────────────────────
export const tagsService = {
  listar:   ()                  => api.get('/tags'),
  criar:    (data)               => api.post('/tags', data),
  atualizar:(id, data)           => api.patch(`/tags/${id}`, data),
  remover:  (id)                 => api.delete(`/tags/${id}`),

  atribuirCliente: (clienteId, tagId)  => api.post(`/clientes/${clienteId}/tags`, { tag_id: tagId }),
  removerDeCliente:(clienteId, tagId)  => api.delete(`/clientes/${clienteId}/tags/${tagId}`),

  atribuirProcesso: (processoId, tagId) => api.post(`/processos/${processoId}/tags`, { tag_id: tagId }),
  removerDeProcesso:(processoId, tagId) => api.delete(`/processos/${processoId}/tags/${tagId}`),

  atribuirAgenda: (agendaId, tagId) => api.post(`/agenda/${agendaId}/tags`, { tag_id: tagId }),
  removerDeAgenda:(agendaId, tagId) => api.delete(`/agenda/${agendaId}/tags/${tagId}`),
}

// ── IA de Documentos (plugável) ───────────────────────────────────────────────
export const iaDocumentosService = {
  status:           ()                  => api.get('/ia/config'),
  configurar:       (data)              => api.post('/ia/config', data),
  gerar:            (data)              => api.post('/ia/gerar-documento', data),
  listar:           (params = {})       => api.get('/ia/documentos?' + new URLSearchParams(params)),
  atualizar:        (docId, conteudo)   => api.patch(`/ia/documentos/${docId}`, { conteudo_gerado: conteudo }),
  enviar:           (docId, canal, destino) => api.post(`/ia/documentos/${docId}/enviar`, { canal, destino }),
}

// ── WhatsApp (plugável) ───────────────────────────────────────────────────────
export const whatsappService = {
  status:      ()      => api.get('/whatsapp/config'),
  configurar:  (data)  => api.post('/whatsapp/config', data),
  desconectar: ()      => api.delete('/whatsapp/config'),
}

export const notificacoesService = {
  listar: () => api.get('/notificacoes'),
}

// ── Cadastro público (landing page) — conta nasce pendente até o pagamento ──
export const cadastroService = {
  criar:  (data)       => api.post('/cadastro', data),
  status: (sessionId)  => api.get('/cadastro/status?session_id=' + encodeURIComponent(sessionId)),
}

// ── Assinatura (Stripe — cobrança do LexRun ao escritório) ────────────────
export const assinaturaService = {
  planos:        ()        => api.get('/assinatura/planos'),
  status:        ()        => api.get('/assinatura/status'),
  criarCheckout: (plano)   => api.post('/assinatura/checkout', { plano }),
  criarPortal:   ()        => api.post('/assinatura/portal', {}),
  elegibilidadeReembolso: ()      => api.get('/assinatura/reembolso/elegibilidade'),
  solicitarReembolso:     ()      => api.post('/assinatura/reembolso/solicitar', {}),
  confirmarReembolso:     (token) => api.post('/assinatura/reembolso/confirmar', { token }),
}

// ── Painel Super-Admin (plataforma — fora do escopo de um escritório) ───────
function getAdminToken() { return localStorage.getItem('jf_admin_token') }
function setAdminToken(t) { localStorage.setItem('jf_admin_token', t) }
function clearAdminToken() { localStorage.removeItem('jf_admin_token') }

async function adminRequest(path, options = {}) {
  const token = getAdminToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new ApiError(data.erro || 'Erro desconhecido.', res.status)
  return data
}

export const superAdminService = {
  login:    (email, senha) => adminRequest('/admin/auth/login', { method: 'POST', body: { email, senha } }),
  me:       ()              => adminRequest('/admin/auth/me'),
  dashboard:()              => adminRequest('/admin/dashboard'),
  escritorios:      (params = {}) => adminRequest('/admin/escritorios?' + new URLSearchParams(params)),
  detalheEscritorio:(id)          => adminRequest(`/admin/escritorios/${id}`),
  alterarStatus:    (id, status)  => adminRequest(`/admin/escritorios/${id}/status`, { method: 'PATCH', body: { status } }),
  setToken: setAdminToken,
  clearToken: clearAdminToken,
  getToken: getAdminToken,
  getAdmin: () => { try { return JSON.parse(localStorage.getItem('jf_admin_data') || 'null') } catch { return null } },
  setAdmin: (a) => localStorage.setItem('jf_admin_data', JSON.stringify(a)),
}

export const pedidosService = {
  saldo:         ()           => api.get('/pedidos/creditos'),
  movimentacoes: ()           => api.get('/pedidos/creditos/movimentacoes'),
  concederTeste: (quantidade) => api.post('/pedidos/creditos/conceder-teste', { quantidade }),
  checkout:      (creditos)   => api.post('/pedidos/creditos/checkout', { creditos }),
  listar:        (aba)        => api.get('/pedidos' + (aba ? `?aba=${aba}` : '')),
  detalhe:       (id)         => api.get(`/pedidos/${id}`),
  criar:         (data)       => api.post('/pedidos', data),
  atualizar:     (id, data)   => api.patch(`/pedidos/${id}`, data),
  confirmar:     (id)         => api.post(`/pedidos/${id}/confirmar`),
  remover:       (id)         => api.delete(`/pedidos/${id}`),
  // URL de download do PDF (auth via querystring — abre direto no navegador)
  pdfUrl:        (id)         => `${BASE_URL}/pedidos/${id}/pdf?token=${getAccessToken()}`,
  anexar:        (id, formData) => api.upload(`/pedidos/${id}/anexos`, formData),
  removerAnexo:  (id, idx)    => api.delete(`/pedidos/${id}/anexos/${idx}`),
}
