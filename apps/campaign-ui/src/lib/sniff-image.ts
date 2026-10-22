/** Image types the desk and the sheet accept. The bytes decide, not the browser's label. */
export type SniffedImage = '.png' | '.jpg' | '.webp' | '.gif';

/** PNG, JPEG, WEBP, or GIF. Anything else, including a renamed file, is null. */
export function sniffImage(buf: Buffer): SniffedImage | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return '.png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return '.webp';
  }
  if (buf.length >= 6) {
    const magic = buf.toString('ascii', 0, 6);
    if (magic === 'GIF87a' || magic === 'GIF89a') return '.gif';
  }
  return null;
}

/** `.jpeg` and `.jpg` are the same type. A missing sniff never agrees. */
export function imageExtensionAgrees(filenameExt: string, sniffed: SniffedImage | null): boolean {
  if (!sniffed) return false;
  const ext = filenameExt.toLowerCase();
  const normal = ext === '.jpeg' ? '.jpg' : ext;
  return normal === sniffed;
}
