import { useEffect, useState } from 'react';
import type { User } from '@/api/types';
import { useAvatar } from '@/lib/queries';
import { initials } from './AppShell';

/** Foto de perfil do usuário, com as iniciais como fallback (sem foto, carregando ou com erro). */
export function Avatar({ user, size, className = '' }: { user: User; size?: number; className?: string }) {
  const { data } = useAvatar(user.id, user.avatarUpdatedAt);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(data);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [data]);

  const style = size ? { width: size, height: size, fontSize: Math.round(size / 3) } : undefined;
  const showImage = !!src && !!user.avatarUpdatedAt;

  return (
    <span className={`avatar ${className}`} style={style}>
      {showImage ? <img src={src} alt="" /> : initials(user.name)}
    </span>
  );
}
