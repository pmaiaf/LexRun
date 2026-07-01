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
  const rawCor = cliente?.corPrimaria || cliente?.cor_primaria || '#0A1C3A'
  const corPrimaria = /^#[0-9A-Fa-f]{6}$/.test(rawCor) ? rawCor : '#0A1C3A'
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
              <div className="w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 6l6 6-6 6" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                </svg>
              </div>
            )}
            <div>
              <p className="text-white text-[15px] font-semibold leading-none tracking-tight">{cliente?.escritorio || 'Meu Portal'}</p>
              <p className="text-white/50 text-[9.5px] mt-1 tracking-[0.14em] uppercase">Área do cliente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {NAV.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all select-none
                ${isActive ? 'bg-white/15 text-white font-semibold shadow-[inset_3px_0_0_rgba(255,255,255,.55)]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`
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
        <header className="bg-white border-b border-gray-100 flex items-center px-4 md:px-6 gap-3 flex-shrink-0" style={{ height: 60 }}>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              Olá, {cliente?.nome?.split(' ')[0] || 'Cliente'} 👋
            </p>
          </div>
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 text-gray-500 hover:bg-gray-50">
            <Bell size={15} />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 ring-1 ring-gold-500/40 flex items-center justify-center text-gold-400 text-[10px] font-semibold">
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
