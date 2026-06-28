import { createContext, useContext, useState, useEffect } from 'react'
import { portalService } from '../../services/api.js'

const PortalCtx = createContext(null)

export function PortalProvider({ children }) {
  const [cliente, setCliente] = useState(() => portalService.getCliente())
  const [loading, setLoading] = useState(!!portalService.getCliente())

  useEffect(() => {
    if (!portalService.getCliente()) { setLoading(false); return }
    portalService.me()
      .then(data => { setCliente(data.cliente); portalService.setCliente(data.cliente) })
      .catch(() => { portalService.clearToken(); setCliente(null) })
      .finally(() => setLoading(false))
  }, [])

  async function portalLogin(email, senha, escritorioSlug) {
    const data = await portalService.login(email, senha, escritorioSlug)
    portalService.setToken(data.token)
    portalService.setCliente(data.cliente)
    setCliente(data.cliente)
    return data
  }

  function portalLogout() {
    portalService.clearToken()
    setCliente(null)
  }

  return (
    <PortalCtx.Provider value={{ cliente, loading, portalLogin, portalLogout }}>
      {children}
    </PortalCtx.Provider>
  )
}

export function usePortal() { return useContext(PortalCtx) }
