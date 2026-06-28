import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { usePortal } from './PortalContext.jsx'
import { LayoutDashboard, FileText, DollarSign, FolderOpen, LogOut, Bell, Calendar } from 'lucide-react'
import { avatarInitials } from '../../utils/helpers.js'

const NAV = [
  { label: 'Início',       to: '/portal/dashboard',  icon: LayoutDashboard },
  { label: 'Meus processos', to: '/portal/processos', icon: FileText },
  { label: 'Documentos',   to: '/portal/documentos', icon: FolderOpen },
  { label: 'Cobranças',    to: '/portal/cobrancas',  icon: DollarSign },
  { label: 'Agenda',       to: '/portal/agenda',     icon: Calendar },
]

export default function PortalLayout() {
  const { cliente, portalLogout } = usePortal()
  const navigate = useNavigate()

  // Cores e logo do escritório vindas do login do portal
  // Valida que a cor é um hex válido antes de aplicar (evita "red" ou valores inválidos)
  const rawCor = cliente?.corPrimaria || cliente?.cor_primaria || '#1B2E4B'
  const corPrimaria = /^#[0-9A-Fa-f]{6}$/.test(rawCor) ? rawCor : '#1B2E4B'
  const logoUrl     = cliente?.logoUrl || cliente?.logo_url || null

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col flex-shrink-0" style={{ background: corPrimaria }}>
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 object-contain flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".9"/>
                  <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
                  <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".55"/>
                  <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" fillOpacity=".25"/>
                </svg>
              </div>
            )}
            <div>
              <p className="text-white text-sm font-semibold leading-none">{cliente?.escritorio || 'Meu Portal'}</p>
              <p className="text-white/50 text-[10px] mt-0.5 tracking-wide uppercase">Área do cliente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {NAV.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all select-none
                ${isActive ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:bg-white/10 hover:text-white'}`
              }>
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
              {avatarInitials(cliente?.nome || 'C')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{cliente?.nome}</p>
              <p className="text-[10px] text-white/50 truncate">Portal do cliente</p>
            </div>
            <button onClick={() => { portalLogout(); navigate('/portal/login') }}
              className="text-white/50 hover:text-white transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 flex items-center px-6 gap-3 flex-shrink-0" style={{ height: 52 }}>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              Olá, {cliente?.nome?.split(' ')[0] || 'Cliente'} 👋
            </p>
          </div>
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50">
            <Bell size={15} />
          </button>
          <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-white text-[10px] font-medium">
            {avatarInitials(cliente?.nome || 'C')}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
