import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, Page } from '@/components/AppShell';
import { ErrorView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { CreateAccountPage } from '@/pages/auth/CreateAccountPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RecoverPasswordPage } from '@/pages/auth/RecoverPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyCodePage } from '@/pages/auth/VerifyCodePage';
import { EnzymesPage } from '@/pages/enzymes/EnzymesPage';
import { CalculateExperimentPage } from '@/pages/experiments/CalculateExperimentPage';
import { CreateExperimentPage } from '@/pages/experiments/CreateExperimentPage';
import { EditExperimentPage } from '@/pages/experiments/EditExperimentPage';
import { ExperimentDetailsPage } from '@/pages/experiments/ExperimentDetailsPage';
import { ExperimentResultsPage } from '@/pages/experiments/ExperimentResultsPage';
import { ExperimentsPage } from '@/pages/experiments/ExperimentsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { TreatmentsPage } from '@/pages/treatments/TreatmentsPage';

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

function GuestOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/experimentos" replace /> : <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CreateAccountPage />} />
        <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />
        <Route path="/verificar-codigo" element={<VerifyCodePage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/experimentos" element={<ExperimentsPage />} />
          <Route path="/experimentos/novo" element={<CreateExperimentPage />} />
          <Route path="/experimentos/:id" element={<ExperimentDetailsPage />} />
          <Route path="/experimentos/:id/editar" element={<EditExperimentPage />} />
          <Route path="/experimentos/:id/calculo" element={<CalculateExperimentPage />} />
          <Route path="/experimentos/:id/resultados" element={<ExperimentResultsPage />} />
          <Route path="/tratamentos" element={<TreatmentsPage />} />
          <Route path="/enzimas" element={<EnzymesPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <Page title="Página não encontrada" crumbs={[{ label: 'Início', to: '/experimentos' }, { label: 'Erro 404' }]}>
                <section className="card">
                  <ErrorView message="ERRO 404 — o endereço acessado não existe." />
                </section>
              </Page>
            }
          />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/experimentos" replace />} />
    </Routes>
  );
}
