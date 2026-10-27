import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Atom,
  CaretDown,
  Flask,
  Gear,
  List,
  MagnifyingGlass,
  Moon,
  SidebarSimple,
  SignOut,
  Sun,
  TestTube,
  User,
} from '@phosphor-icons/react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { preferences } from '@/lib/session';
import { useAllExperiments } from '@/lib/queries';
import { toPercent } from '@/lib/format';
import { IconLogo, WordmarkLogo } from './Brand';
import { useDismiss } from './Controls';

const NAV = [
  { to: '/experimentos', label: 'Experimentos', Icon: Flask },
  { to: '/tratamentos', label: 'Tratamentos', Icon: TestTube },
  { to: '/enzimas', label: 'Enzimas', Icon: Atom },
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => preferences.get('sidebarCollapsed', false));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      preferences.set('sidebarCollapsed', !c);
      return !c;
    });
  };

  const signOut = () => {
    logout('Até logo...');
    navigate('/login', { replace: true });
  };

  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''} ${drawerOpen ? 'drawer-open' : ''}`}>
      <aside className="sidebar" aria-label="Menu principal">
        <Link to="/experimentos" className="sidebar-brand" aria-label="Enzitech - início">
          <IconLogo width={32} />
          <span className="sidebar-wordmark">
            <WordmarkLogo height={24} />
          </span>
        </Link>

        <nav className="sidebar-section">
          <span className="sidebar-heading">Laboratório</span>
          {NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className="nav-link" title={collapsed ? label : undefined}>
              {({ isActive }) => (
                <>
                  <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                  <span className="nav-label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-section">
          <NavLink to="/configuracoes" className="nav-link" title={collapsed ? 'Configurações' : undefined}>
            {({ isActive }) => (
              <>
                <Gear size={22} weight={isActive ? 'fill' : 'regular'} />
                <span className="nav-label">Configurações</span>
              </>
            )}
          </NavLink>
          <button type="button" className="nav-link danger" onClick={signOut} title={collapsed ? 'Sair' : undefined}>
            <SignOut size={22} />
            <span className="nav-label">Sair</span>
          </button>
        </div>
      </aside>
      <div className="backdrop" onClick={() => setDrawerOpen(false)} />

      <header className="topbar">
        <button className="icon-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
          <List size={22} />
        </button>
        <button
          className="icon-btn desktop-only"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <SidebarSimple size={22} />
        </button>
        <ExperimentSearch />
        <div className="topbar-actions">
          <ThemeToggle />
          <UserMenu onSignOut={signOut} />
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function ThemeToggle() {
  const { isDark, setThemeMode } = useSettings();
  return (
    <button
      className="icon-btn"
      onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  if (!user) return null;
  const role = user.role === 'ADMIN' ? 'Administrador' : 'Comum';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="user-button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <span className="avatar">{initials(user.name)}</span>
        <span className="user-button-text">
          <span className="user-button-name">{user.name}</span>
          <br />
          <span className="user-button-role">{role}</span>
        </span>
        <CaretDown size={14} className="user-button-text" />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-user">
            <span className="avatar">{initials(user.name)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="cell-title">{user.name}</div>
              <div className="cell-sub" style={{ maxWidth: 180 }}>
                {user.email}
              </div>
            </div>
          </div>
          <div className="menu-divider" />
          <Link to="/configuracoes" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <User size={18} /> Minha conta e preferências
          </Link>
          <button className="menu-item danger" role="menuitem" onClick={onSignOut}>
            <SignOut size={18} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

function ExperimentSearch() {
  const navigate = useNavigate();
  const { data } = useAllExperiments();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (data?.experiments ?? [])
      .filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.querySelector('input')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ref]);

  const go = (id: string) => {
    setQuery('');
    setOpen(false);
    navigate(`/experimentos/${id}`);
  };

  return (
    <div className="topbar-search" ref={ref}>
      <div className="search-input">
        <MagnifyingGlass size={18} />
        <input
          type="search"
          placeholder="Buscar experimentos…  (Ctrl + K)"
          aria-label="Buscar experimentos"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setHighlight((h) => Math.min(h + 1, results.length - 1));
            if (e.key === 'ArrowUp') setHighlight((h) => Math.max(h - 1, 0));
            if (e.key === 'Enter' && results[highlight]) go(results[highlight].id);
          }}
        />
      </div>
      {open && query.trim() && (
        <div className="menu" style={{ left: 0, right: 'auto', width: '100%' }} role="listbox">
          {results.length === 0 ? (
            <div className="menu-item" style={{ cursor: 'default', color: 'var(--on-surface-variant)' }}>
              Nenhum experimento encontrado
            </div>
          ) : (
            results.map((e, i) => (
              <button
                key={e.id}
                role="option"
                aria-selected={i === highlight}
                className={`menu-item ${i === highlight ? 'highlight' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => go(e.id)}
              >
                <Flask size={18} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name}
                </span>
                <span className="chip chip-neutral">{toPercent(e.progress)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Page({
  title,
  description,
  crumbs = [],
  actions,
  narrow,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  narrow?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (typeof title === 'string') document.title = `${title} · Enzitech`;
    return () => {
      document.title = 'Enzitech';
    };
  }, [title]);

  return (
    <div className={`page ${narrow ? 'narrow' : ''}`}>
      {crumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Você está em">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', gap: 6 }}>
              {i > 0 && <span aria-hidden="true">›</span>}
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
