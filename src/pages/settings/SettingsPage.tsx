import type { ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowSquareOut, Globe, Info, Moon, Question, SignOut, SlidersHorizontal, Sun, UserCircle } from '@phosphor-icons/react';
import { initials, Page } from '@/components/AppShell';
import { ThemedSvg } from '@/components/Brand';
import { Button } from '@/components/Button';
import { SegmentedButton, Switch } from '@/components/Controls';
import { useAuth } from '@/context/AuthContext';
import { useSettings, type ThemeMode } from '@/context/SettingsContext';
import { AboutContent, FaqContent } from './AboutContent';

const GITHUB_URL = 'https://github.com/bcccoworkingufape/enzitech_app';
const BCC_URL = 'http://app.uag.ufrpe.br/bcccoworking/home';
const ENVIRONMENTS: Record<string, string> = { dev: 'Desenvolvimento', stage: 'Teste', prod: 'Produção' };

const SECTIONS = [
  { id: 'conta', label: 'Conta', Icon: UserCircle },
  { id: 'preferencias', label: 'Preferências', Icon: SlidersHorizontal },
  { id: 'sobre', label: 'Sobre', Icon: Info },
  { id: 'faq', label: 'Perguntas frequentes', Icon: Question },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({ title, description, control }: { title: string; description?: ReactNode; control?: ReactNode }) {
  return (
    <div className="settings-field">
      <div className="settings-field-text">
        <div className="settings-field-title">{title}</div>
        {description && <div className="settings-field-sub">{description}</div>}
      </div>
      {control && <div className="settings-field-control">{control}</div>}
    </div>
  );
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode, confirmDeletion, setConfirmDeletion } = useSettings();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const env = import.meta.env.VITE_ENV || 'prod';
  if (!user) return null;

  const current: SectionId = SECTIONS.find((s) => s.id === params.get('secao'))?.id ?? 'conta';

  return (
    <Page
      title="Configurações"
      description="Sua conta, preferências e informações sobre o Enzitech."
      crumbs={[{ label: 'Início', to: '/experimentos' }, { label: 'Configurações' }]}
    >
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Seções das configurações">
          {SECTIONS.map(({ id, label, Icon }) => (
            <Link
              key={id}
              to={id === 'conta' ? '.' : `?secao=${id}`}
              replace
              className="settings-nav-link"
              aria-current={current === id ? 'page' : undefined}
            >
              <Icon size={18} weight={current === id ? 'fill' : 'regular'} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="settings-content">
          {current === 'conta' && (
            <>
              <Section title="Perfil" description="Informações da conta usada para acessar o Enzitech.">
                <div className="settings-panel">
                  <div className="settings-profile">
                    <span className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                      {initials(user.name)}
                    </span>
                    <div className="settings-profile-name">{user.name}</div>
                  </div>
                  <Field title="Nome" control={<span className="settings-value">{user.name}</span>} />
                  <Field title="E-mail" control={<span className="settings-value">{user.email}</span>} />
                  <Field
                    title="Tipo de usuário"
                    description={user.role === 'ADMIN' ? 'Pode cadastrar e gerenciar enzimas.' : undefined}
                    control={
                      <span className={`chip ${user.role === 'ADMIN' ? 'chip-done' : 'chip-neutral'}`}>
                        {user.role === 'ADMIN' ? 'Administrador' : 'Comum'}
                      </span>
                    }
                  />
                </div>
              </Section>

              <Section title="Sessão">
                <div className="settings-panel">
                  <Field
                    title="Sair da conta"
                    description="Encerra sua sessão neste navegador."
                    control={
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<SignOut size={16} />}
                        onClick={() => {
                          logout('Até logo...');
                          navigate('/login', { replace: true });
                        }}
                      >
                        Sair
                      </Button>
                    }
                  />
                </div>
              </Section>
            </>
          )}

          {current === 'preferencias' && (
            <Section title="Preferências" description="Ajustes salvos apenas neste navegador.">
              <div className="settings-panel">
                <Field
                  title="Tema"
                  description="Siga o sistema ou escolha entre claro e escuro."
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
                <Field
                  title="Confirmação de exclusão"
                  description="Pedir confirmação antes de excluir experimentos, tratamentos e enzimas."
                  control={<Switch checked={confirmDeletion} onChange={setConfirmDeletion} label="Confirmação de exclusão" />}
                />
              </div>
            </Section>
          )}

          {current === 'sobre' && (
            <>
              <Section title="Sobre o Enzitech">
                <AboutContent />
              </Section>
              <Section title="Detalhes técnicos">
                <div className="settings-panel">
                  <Field title="Ambiente" control={<span className="settings-value">{ENVIRONMENTS[env] ?? 'Desconhecido'}</span>} />
                  <Field
                    title="Versão"
                    control={
                      <a className="settings-link" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                        {__APP_VERSION__}
                        <ArrowSquareOut size={14} />
                      </a>
                    }
                  />
                </div>
              </Section>
              <a href={BCC_URL} target="_blank" rel="noopener noreferrer" className="developed-by" title="BCC Coworking">
                <ThemedSvg name="developed_by" alt="Desenvolvido por BCC Coworking" />
              </a>
            </>
          )}

          {current === 'faq' && (
            <Section title="Perguntas frequentes">
              <FaqContent />
            </Section>
          )}
        </div>
      </div>
    </Page>
  );
}
