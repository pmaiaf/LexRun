import { createContext, useContext, useState, useEffect } from 'react'
import { superAdminService } from '../../services/api.js'

const AdminCtx = createContext(null)

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => superAdminService.getAdmin())
  const [loading, setLoading] = useState(!!superAdminService.getToken())

  useEffect(() => {
    if (!superAdminService.getToken()) { setLoading(false); return }
    superAdminService.me()
      .then(data => { setAdmin(data); superAdminService.setAdmin(data) })
      .catch(() => { superAdminService.clearToken(); setAdmin(null) })
      .finally(() => setLoading(false))
  }, [])

  async function adminLogin(email, senha) {
    const data = await superAdminService.login(email, senha)
    superAdminService.setToken(data.token)
    superAdminService.setAdmin(data.admin)
    setAdmin(data.admin)
    return data
  }

  function adminLogout() {
    superAdminService.clearToken()
    setAdmin(null)
  }

  return (
    <AdminCtx.Provider value={{ admin, loading, adminLogin, adminLogout }}>
      {children}
    </AdminCtx.Provider>
  )
}

export function useAdmin() { return useContext(AdminCtx) }
