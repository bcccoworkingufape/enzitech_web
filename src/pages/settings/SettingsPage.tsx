import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowSquareOut,
  Camera,
  Globe,
  Info,
  Moon,
  Question,
  SignOut,
  SlidersHorizontal,
  Sun,
  Trash,
  UserCircle,
} from '@phosphor-icons/react';
import { errorMessage } from '@/api/client';
import { usersApi } from '@/api/endpoints';
import { Page } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { ThemedSvg } from '@/components/Brand';
import { Button } from '@/components/Button';
import { SegmentedButton, Switch } from '@/components/Controls';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/DialogContext';
import { useSettings, type ThemeMode } from '@/context/SettingsContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { AvatarImageError, prepareAvatar } from '@/lib/avatarImage';
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

function ProfilePhoto() {
  const { user, updateUser } = useAuth();
  const { confirmDeletion } = useSettings();
  const confirm = useConfirm();
  const snackbar = useSnackbar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  if (!user) return null;

  const hasPhoto = !!user.avatarUpdatedAt;
  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    setBusy('upload');
    try {
      const image = await prepareAvatar(file);
      updateUser(await usersApi.uploadAvatar(image));
      snackbar.show('Foto de perfil atualizada.');
    } catch (error) {
      const message =
        error instanceof AvatarImageError ? error.message : errorMessage(error, { useBackendMessage: true });
      snackbar.show(message, { type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (
      confirmDeletion &&
      !(await confirm({
        title: 'Remover foto de perfil',
        content: 'Sua foto será removida e suas iniciais voltarão a ser exibidas.',
        confirmLabel: 'Remover',
      }))
    )
      return;
    setBusy('remove');
    try {
      updateUser(await usersApi.removeAvatar());
      snackbar.show('Foto de perfil removida.');
    } catch (error) {
      snackbar.show(errorMessage(error), { type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="settings-profile">
      <button
        type="button"
        className="avatar-edit"
        onClick={pick}
        disabled={!!busy}
        aria-label={hasPhoto ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
        title={hasPhoto ? 'Alterar foto' : 'Adicionar foto'}
      >
        <Avatar user={user} size={72} />
        <span className="avatar-edit-badge" aria-hidden="true">
          {busy === 'upload' ? <span className="spinner small" /> : <Camera size={16} weight="fill" />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) upload(file);
        }}
      />
      <div className="settings-profile-text">
        <div className="settings-profile-name">{user.name}</div>
        <div className="settings-profile-actions">
          <Button variant="tonal" size="sm" icon={<Camera size={16} />} onClick={pick} loading={busy === 'upload'} disabled={!!busy}>
            {hasPhoto ? 'Alterar foto' : 'Adicionar foto'}
          </Button>
          {hasPhoto && (
            <Button variant="text" size="sm" icon={<Trash size={16} />} onClick={remove} loading={busy === 'remove'} disabled={!!busy}>
              Remover
            </Button>
          )}
        </div>
      </div>
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
              <Section title="Perfil" description="Informações da conta usada para acessar o Enzitech. A foto é recortada no centro e reduzida automaticamente.">
                <div className="settings-panel">
                  <ProfilePhoto />
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
