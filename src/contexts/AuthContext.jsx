import { createContext, useContext, useState, useEffect } from 'react'
import { authService, setTokens, clearTokens, getAccessToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true) // verifica sessão ao iniciar

  // Ao montar, verifica se há token salvo e busca o usuário
  useEffect(() => {
    const token = getAccessToken()
    if (!token) { setLoading(false); return }
    authService.me()
      .then(data => setUser(data.usuario))
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  // Ouve evento de logout disparado pelo interceptor de 401
  useEffect(() => {
    const handler = () => { setUser(null); clearTokens() }
    window.addEventListener('jf:logout', handler)
    return () => window.removeEventListener('jf:logout', handler)
  }, [])

  async function login(email, senha) {
    const data = await authService.login(email, senha) // lança ApiError se falhar
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.usuario)
    localStorage.setItem('jf_user', JSON.stringify(data.usuario))
    return data
  }

  async function logout() {
    try { await authService.logout(localStorage.getItem('jf_refresh')) } catch {}
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
