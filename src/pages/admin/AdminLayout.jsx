import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext.jsx'
import { LayoutDashboard, Building2, LogOut, ShieldCheck } from 'lucide-react'
import { avatarInitials } from '../../utils/helpers.js'

const NAV = [
  { label: 'Visão geral',   to: '/admin/dashboard',    icon: LayoutDashboard },
  { label: 'Escritórios',   to: '/admin/escritorios',  icon: Building2 },
]

export default function AdminLayout() {
  const { admin, adminLogout } = useAdmin()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-56 flex flex-col flex-shrink-0 bg-gray-900 border-r border-gray-800">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-gray-300"/>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">LexRun</p>
              <p className="text-gray-500 text-[10px] mt-0.5 tracking-wide uppercase">Painel admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {NAV.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all select-none
                ${isActive ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'}`
              }>
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 text-[10px] font-medium flex-shrink-0">
              {avatarInitials(admin?.nome || 'A')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{admin?.nome}</p>
              <p className="text-[10px] text-gray-500 truncate">{admin?.email}</p>
            </div>
            <button onClick={() => { adminLogout(); navigate('/admin/login') }}
              className="text-gray-500 hover:text-white transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
