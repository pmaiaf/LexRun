import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ToastProvider } from './components/ui/index.jsx'
import { PortalProvider } from './pages/portal/PortalContext.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import PortalLayout from './pages/portal/PortalLayout.jsx'
import { Spinner } from './components/ui/index.jsx'

// Páginas internas
import LoginPage          from './pages/LoginPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage  from './pages/ResetPasswordPage.jsx'
import DashboardPage      from './pages/DashboardPage.jsx'
import KanbanPage         from './pages/KanbanPage.jsx'
import ProcessosPage      from './pages/ProcessosPage.jsx'
import ProcessoDetalhePage from './pages/ProcessoDetalhePage.jsx'
import ClientesPage       from './pages/ClientesPage.jsx'
import AgendaPage         from './pages/AgendaPage.jsx'
import PedidosPage        from './pages/PedidosPage.jsx'
import FinanceiroPage     from './pages/FinanceiroPage.jsx'
import PortalPage         from './pages/PortalPage.jsx'
import PlanosPage         from './pages/PlanosPage.jsx'
import ReembolsoConfirmarPage from './pages/ReembolsoConfirmarPage.jsx'
import RelatoriosPage     from './pages/RelatoriosPage.jsx'
import ConfiguracoesPage  from './pages/ConfiguracoesPage.jsx'

// Portal do cliente
import PortalLoginPage    from './pages/portal/PortalLoginPage.jsx'
import PortalForgotPasswordPage from './pages/portal/PortalForgotPasswordPage.jsx'
import PortalResetPasswordPage  from './pages/portal/PortalResetPasswordPage.jsx'
import PortalDashboard    from './pages/portal/PortalDashboard.jsx'
import { PortalProcessosList, PortalProcessoDetalhe } from './pages/portal/PortalProcessos.jsx'
import { PortalDocumentos, PortalCobrancas }          from './pages/portal/PortalDocumentosCobrancas.jsx'
import PortalAgenda                                    from './pages/portal/PortalAgenda.jsx'
import { usePortal } from './pages/portal/PortalContext.jsx'

// Painel super-admin (plataforma)
import { AdminProvider, useAdmin } from './pages/admin/AdminContext.jsx'
import AdminLoginPage     from './pages/admin/AdminLoginPage.jsx'
import AdminLayout        from './pages/admin/AdminLayout.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminEscritoriosPage from './pages/admin/AdminEscritoriosPage.jsx'

// Landing page (site público comercial)
import LandingPage           from './pages/landing/LandingPage.jsx'
import SignupPage            from './pages/landing/SignupPage.jsx'
import SignupSuccessPage     from './pages/landing/SignupSuccessPage.jsx'
import SignupCancelledPage   from './pages/landing/SignupCancelledPage.jsx'

// Páginas jurídicas
import TermsOfUsePage    from './pages/legal/TermsOfUsePage.jsx'
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage.jsx'
import RefundPolicyPage  from './pages/legal/RefundPolicyPage.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={24} className="text-brand-700" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PortalRoute({ children }) {
  const { cliente, loading } = usePortal()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={24} className="text-brand-700" />
    </div>
  )
  return cliente ? children : <Navigate to="/portal/login" replace />
}

function AdminRoute({ children }) {
  const { admin, loading } = useAdmin()
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Spinner size={24} className="text-gray-300" />
    </div>
  )
  return admin ? children : <Navigate to="/admin/login" replace />
}

// Raiz pública: visitante vê a landing comercial; quem já está logado
// é levado direto para o dashboard, sem ver a landing de novo.
function RaizPublica() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={24} className="text-brand-700" />
    </div>
  )
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export default function App() {
  return (
    <AuthProvider>
      <PortalProvider>
        <AdminProvider>
          <ToastProvider>
            <Routes>
              {/* ── Site público comercial ───────────────────────────────── */}
              <Route path="/" element={<RaizPublica />} />
              <Route path="/comecar" element={<SignupPage />} />
              <Route path="/cadastro/sucesso" element={<SignupSuccessPage />} />
              <Route path="/cadastro/cancelado" element={<SignupCancelledPage />} />
              <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
              <Route path="/politica-de-reembolso" element={<RefundPolicyPage />} />

              {/* ── Auth ─────────────────────────────────────────────────── */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
              <Route path="/reembolso/confirmar" element={<ReembolsoConfirmarPage />} />

              {/* ── App interno (layout sem path próprio — preserva as URLs
                   /dashboard, /kanban etc. exatamente como antes, sem prefixo) ── */}
              <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                <Route path="dashboard"          element={<DashboardPage />} />
                <Route path="kanban"             element={<KanbanPage />} />
                <Route path="processos"          element={<ProcessosPage />} />
                <Route path="processos/:id"      element={<ProcessoDetalhePage />} />
                <Route path="clientes"           element={<ClientesPage />} />
                <Route path="agenda"             element={<AgendaPage />} />
                <Route path="pedidos"            element={<PedidosPage />} />
                <Route path="financeiro"         element={<FinanceiroPage />} />
                <Route path="portal"             element={<PortalPage />} />
                <Route path="relatorios"         element={<RelatoriosPage />} />
                <Route path="planos"             element={<PlanosPage />} />
                <Route path="configuracoes"      element={<ConfiguracoesPage />} />
              </Route>

              {/* ── Portal do cliente ─────────────────────────────────────── */}
              <Route path="/portal/login" element={<PortalLoginPage />} />
              <Route path="/portal/esqueci-senha" element={<PortalForgotPasswordPage />} />
              <Route path="/portal/redefinir-senha" element={<PortalResetPasswordPage />} />
              <Route path="/portal" element={<PortalRoute><PortalLayout /></PortalRoute>}>
                <Route index                   element={<Navigate to="/portal/dashboard" replace />} />
                <Route path="dashboard"        element={<PortalDashboard />} />
                <Route path="processos"        element={<PortalProcessosList />} />
                <Route path="processos/:id"    element={<PortalProcessoDetalhe />} />
                <Route path="documentos"       element={<PortalDocumentos />} />
                <Route path="cobrancas"        element={<PortalCobrancas />} />
                <Route path="agenda"           element={<PortalAgenda />} />
              </Route>

              {/* ── Painel super-admin (plataforma) ───────────────────────── */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index                element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard"     element={<AdminDashboardPage />} />
                <Route path="escritorios"   element={<AdminEscritoriosPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AdminProvider>
      </PortalProvider>
    </AuthProvider>
  )
}
