import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowSquareOut,
  ComputerTower,
  GitBranch,
  Globe,
  IdentificationBadge,
  Info,
  Moon,
  PaintRoller,
  Question,
  SignOut,
  Sun,
  Trash,
  UserCircle,
} from '@phosphor-icons/react';
import { initials, Page } from '@/components/AppShell';
import { ThemedSvg } from '@/components/Brand';
import { Button } from '@/components/Button';
import { Card, SegmentedButton, Switch } from '@/components/Controls';
import { useAuth } from '@/context/AuthContext';
import { useSettings, type ThemeMode } from '@/context/SettingsContext';
import { AboutContent, FaqContent } from './AboutContent';

const GITHUB_URL = 'https://github.com/bcccoworkingufape/enzitech_app';
const BCC_URL = 'http://app.uag.ufrpe.br/bcccoworking/home';
const ENVIRONMENTS: Record<string, string> = { dev: 'Desenvolvimento', stage: 'Teste', prod: 'Produção' };

function Row({ icon, title, subtitle, control }: { icon: ReactNode; title: string; subtitle?: ReactNode; control?: ReactNode }) {
  return (
    <div className="settings-row">
      <span className="settings-row-icon">{icon}</span>
      <div className="settings-row-text">
        <div className="settings-row-title">{title}</div>
        {subtitle && <div className="settings-row-sub">{subtitle}</div>}
      </div>
      {control}
    </div>
  );
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode, confirmDeletion, setConfirmDeletion } = useSettings();
  const navigate = useNavigate();
  const env = import.meta.env.VITE_ENV || 'prod';
  if (!user) return null;

  return (
    <Page
      title="Configurações"
      description="Sua conta, preferências e informações sobre o Enzitech."
      crumbs={[{ label: 'Início', to: '/experimentos' }, { label: 'Configurações' }]}
    >
      <div className="grid-main-side">
        <div className="stack">
          <Card title="Conta" icon={<UserCircle size={20} />} bodyless>
            <div className="settings-row">
              <span className="avatar" style={{ width: 48, height: 48, fontSize: 16 }}>{initials(user.name)}</span>
              <div className="settings-row-text">
                <div className="settings-row-title" style={{ fontSize: 17 }}>{user.name}</div>
                <div className="settings-row-sub">{user.email}</div>
              </div>
              <span className={`chip ${user.role === 'ADMIN' ? 'chip-done' : 'chip-neutral'}`}>
                <IdentificationBadge size={14} />
                {user.role === 'ADMIN' ? 'Administrador' : 'Comum'}
              </span>
            </div>
            <div className="settings-row" style={{ justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                icon={<SignOut size={18} />}
                onClick={() => {
                  logout('Até logo...');
                  navigate('/login', { replace: true });
                }}
              >
                Sair
              </Button>
            </div>
          </Card>

          <Card title="Preferências" icon={<PaintRoller size={20} />} bodyless>
            <Row
              icon={<PaintRoller size={22} />}
              title="Tema"
              subtitle="Siga o sistema ou escolha claro/escuro."
              control={
                <SegmentedButton<ThemeMode>
                  ariaLabel="Tema"
                  value={themeMode}
                  onChange={setThemeMode}
                  options={[
                    { value: 'system', icon: <Globe size={16} />, label: 'Sistema' },
                    { value: 'light', icon: <Sun size={16} />, label: 'Claro' },
                    { value: 'dark', icon: <Moon size={16} />, label: 'Escuro' },
                  ]}
                />
              }
            />
            <Row
              icon={<Trash size={22} />}
              title="Confirmação de exclusão"
              subtitle="Pedir confirmação antes de excluir experimentos, tratamentos e enzimas."
              control={<Switch checked={confirmDeletion} onChange={setConfirmDeletion} label="Confirmação de exclusão" />}
            />
          </Card>

          <Card title="Sobre o Enzitech" icon={<Info size={20} />}>
            <AboutContent />
          </Card>

          <Card title="Perguntas frequentes" icon={<Question size={20} />}>
            <FaqContent />
          </Card>
        </div>

        <div className="stack">
          <Card title="Detalhes" bodyless>
            <Row icon={<ComputerTower size={22} />} title="Ambiente" subtitle={ENVIRONMENTS[env] ?? 'Desconhecido'} />
            <Row
              icon={<GitBranch size={22} />}
              title="Versão"
              subtitle={__APP_VERSION__}
              control={
                <a className="icon-btn sm" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" title="Ver no GitHub" aria-label="Ver no GitHub">
                  <ArrowSquareOut size={18} />
                </a>
              }
            />
          </Card>
          <a href={BCC_URL} target="_blank" rel="noopener noreferrer" className="developed-by" title="BCC Coworking">
            <ThemedSvg name="developed_by" alt="Desenvolvido por BCC Coworking" />
          </a>
        </div>
      </div>
    </Page>
  );
}
