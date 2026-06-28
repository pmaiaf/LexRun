import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import {
  LayoutDashboard, Columns, FileText, Calendar,
  BarChart2, Users, CreditCard, Settings, Bell,
  Search, LogOut, BarChart, UserSquare2, AlertTriangle, Clock, DollarSign,
  Menu, X, Sparkles
} from 'lucide-react'
import { avatarInitials, formatDate } from '../../utils/helpers.js'
import { useApi } from '../../hooks/useApi.js'
import { notificacoesService } from '../../services/api.js'

const ICONE_POR_TIPO = { cobranca: DollarSign, processo: FileText, agenda: Clock }

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { label: 'Dashboard',   to: '/dashboard',    icon: LayoutDashboard },
    ]
  },
  {
    label: 'Produtividade',
    items: [
      { label: 'Pedidos',     to: '/pedidos',      icon: Sparkles },
      { label: 'Kanban',      to: '/kanban',       icon: Columns  },
      { label: 'Processos',   to: '/processos',    icon: FileText },
      { label: 'Clientes',    to: '/clientes',     icon: UserSquare2 },
      { label: 'Agenda',      to: '/agenda',       icon: Calendar },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Financeiro',  to: '/financeiro',   icon: BarChart2 },
      { label: 'Relatórios',  to: '/relatorios',   icon: BarChart },
      { label: 'Portal',      to: '/portal',       icon: Users },
    ]
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Planos',      to: '/planos',       icon: CreditCard },
      { label: 'Configurações',to:'/configuracoes',icon: Settings },
    ]
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifAberta, setNotifAberta] = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const notifRef = useRef(null)
  const { data: notifData, refetch: refetchNotif } = useApi(() => notificacoesService.listar(), [])
  const notificacoes = notifData?.data || []
  const totalNotificacoes = notificacoes.length

  // Atualiza a lista periodicamente (a cada 2 min) para refletir novos
  // vencimentos sem precisar recarregar a página
  useEffect(() => {
    const interval = setInterval(() => refetchNotif(), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetchNotif])

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    function handleClickFora(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifAberta(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Backdrop escuro no mobile quando a sidebar está aberta */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarAberta(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixa no desktop, painel deslizante no mobile */}
      <aside className={`w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 z-40
        fixed inset-y-0 left-0 transition-transform duration-200 ease-out
        md:static md:translate-x-0
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".9"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".25"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-800 leading-none">LexRun</p>
              <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide uppercase">Gestão Jurídica</p>
            </div>
          </div>
          {/* Botão fechar — só aparece no mobile */}
          <button onClick={() => setSidebarAberta(false)}
            className="md:hidden text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4">
          {NAV_SECTIONS.map(({ label, items }) => (
            <div key={label || 'root'}>
              {label && (
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider px-3 mb-1">{label}</p>
              )}
              <div className="space-y-0.5">
                {items.map(({ label: lbl, to, icon: Icon }) => (
                  <NavLink key={to} to={to}
                    onClick={() => setSidebarAberta(false)}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Icon size={15} className="flex-shrink-0" />
                    <span className="flex-1">{lbl}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
              {avatarInitials(user?.nome || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user?.nome}</p>
              <p className="text-[10px] text-gray-400 truncate">Plano {user?.plano}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login') }} className="text-gray-400 hover:text-gray-600" title="Sair">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 flex items-center px-4 md:px-6 gap-3 flex-shrink-0" style={{ height: 52 }}>
          {/* Botão hambúrguer — só no mobile */}
          <button onClick={() => setSidebarAberta(true)}
            className="md:hidden text-gray-500 hover:text-gray-700 -ml-1 p-1" aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 max-w-xs cursor-text">
            <Search size={13} className="text-gray-400" />
            <span className="text-sm text-gray-400 truncate">Buscar processo ou cliente...</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifAberta(v => !v)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50">
                <Bell size={15} />
                {totalNotificacoes > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </button>

              {notifAberta && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Notificações</p>
                  </div>
                  {notificacoes.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-400">Tudo em dia — nenhuma notificação pendente.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notificacoes.map((n, i) => {
                        const Icone = ICONE_POR_TIPO[n.tipo] || AlertTriangle
                        return (
                          <button key={i} onClick={() => { setNotifAberta(false); navigate(n.link) }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              n.urgencia === 'alta' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              <Icone size={13}/>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 leading-tight">{n.titulo}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{n.descricao}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(n.data)}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-white text-[10px] font-medium ml-1">
              {avatarInitials(user?.nome || 'U')}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
