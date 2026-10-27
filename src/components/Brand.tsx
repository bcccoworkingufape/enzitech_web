import { useSettings } from '@/context/SettingsContext';

export function WordmarkLogo({ height = 28 }: { height?: number }) {
  return (
    <span
      role="img"
      aria-label="Enzitech"
      style={{
        display: 'inline-block',
        height,
        width: (height * 134) / 28,
        backgroundColor: 'var(--logo-color)',
        WebkitMask: 'url(/svgs/logo.svg) center / contain no-repeat',
        mask: 'url(/svgs/logo.svg) center / contain no-repeat',
      }}
    />
  );
}

export function ThemedSvg({
  name,
  alt = '',
  className,
  style,
}: {
  name: 'full_logo' | 'error' | 'not_found' | 'developed_by' | 'splash';
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { isDark } = useSettings();
  return <img src={`/svgs/${isDark ? 'dark' : 'light'}/${name}.svg`} alt={alt} className={className} style={style} />;
}

export function LogoMark({ width = 75 }: { width?: number }) {
  const { isDark } = useSettings();
  return <img src={isDark ? '/images/logo_on_dark.png' : '/images/logo_green.png'} alt="Enzitech" width={width} />;
}

export function IconLogo({ width = 75, spinning = false }: { width?: number; spinning?: boolean }) {
  return <img src="/svgs/icon_logo.svg" alt="" width={width} className={spinning ? 'logo-spin' : undefined} />;
}
