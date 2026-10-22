import { describe, expect, it } from 'vitest';
import { imageExtensionAgrees, sniffImage } from '../src/lib/sniff-image';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const WEBP = Buffer.from('RIFF....WEBP', 'ascii');
const GIF = Buffer.from('GIF89a', 'ascii');

describe('sniffImage', () => {
  it('names PNG, JPEG, WEBP, and GIF from the bytes', () => {
    expect(sniffImage(PNG)).toBe('.png');
    expect(sniffImage(JPEG)).toBe('.jpg');
    expect(sniffImage(WEBP)).toBe('.webp');
    expect(sniffImage(GIF)).toBe('.gif');
    expect(sniffImage(Buffer.from('not an image'))).toBeNull();
  });

  it('rejects a body whose bytes disagree with the extension', () => {
    expect(imageExtensionAgrees('.png', sniffImage(PNG))).toBe(true);
    expect(imageExtensionAgrees('.jpeg', sniffImage(JPEG))).toBe(true);
    expect(imageExtensionAgrees('.jpg', sniffImage(PNG))).toBe(false);
    expect(imageExtensionAgrees('.png', sniffImage(Buffer.from('MZ')))).toBe(false);
    expect(imageExtensionAgrees('.gif', sniffImage(GIF))).toBe(true);
  });
});
