/** Lado (px) da foto de perfil enviada à API: cobre os 72px da tela de configurações em telas 3x. */
export const AVATAR_SIZE = 256;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const QUALITY = 0.85;

export class AvatarImageError extends Error {}

/**
 * Recorta o centro da imagem em um quadrado e reduz para AVATAR_SIZE, gerando WebP
 * (ou JPEG nos navegadores que não codificam WebP). O resultado fica em ~10–30 KB,
 * então todo o custo de processamento fica no navegador e a API só armazena bytes.
 * Reencodar também descarta metadados como EXIF/GPS da foto original.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new AvatarImageError('Selecione um arquivo de imagem.');
  if (file.size > MAX_INPUT_BYTES) throw new AvatarImageError('A imagem deve ter no máximo 20 MB.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AvatarImageError('Não foi possível ler essa imagem. Use JPEG, PNG ou WebP.');
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const size = Math.min(AVATAR_SIZE, side);

    const render = (background?: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
      return canvas;
    };

    const webp = await toBlob(render(), 'image/webp');
    if (webp?.type === 'image/webp') return webp;
    // JPEG não tem transparência: fundo branco evita áreas pretas em PNGs transparentes.
    const jpeg = await toBlob(render('#ffffff'), 'image/jpeg');
    if (!jpeg) throw new AvatarImageError('Não foi possível processar a imagem.');
    return jpeg;
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}
