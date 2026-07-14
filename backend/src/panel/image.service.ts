import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Weryfikacja typu po MAGIC BYTES (nie po rozszerzeniu). Dopuszczamy tylko obrazy rastrowe.
function sniffImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png =
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const gif =
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
  const webp =
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50;
  return jpeg || png || gif || webp;
}

@Injectable()
export class ImageService {
  private readonly uploadsDir: string;

  constructor(config: ConfigService) {
    this.uploadsDir = config.get<string>('UPLOADS_DIR') ?? 'uploads';
  }

  /**
   * Waliduje i przetwarza obraz: magic bytes → re-encode sharp→WebP (max 1600px, strip EXIF),
   * losowa nazwa (cuid), zapis do uploads/. Zwraca publiczny URL. Re-encode usuwa metadane
   * i ewentualne payloady ukryte w pliku.
   */
  async processAndSave(
    file: { buffer: Buffer; size: number } | undefined,
  ): Promise<string> {
    if (!file || !file.buffer?.length)
      throw new BadRequestException('Brak pliku');
    if (file.size > MAX_UPLOAD_BYTES)
      throw new BadRequestException('Plik przekracza 5 MB');
    if (!sniffImage(file.buffer))
      throw new BadRequestException(
        'Niedozwolony typ pliku (oczekiwano JPEG/PNG/GIF/WebP)',
      );

    let webp: Buffer;
    try {
      webp = await sharp(file.buffer, { failOn: 'error' })
        .rotate() // auto-orient, potem metadane są odrzucane (nie kopiujemy EXIF)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestException('Nieprawidłowy obraz');
    }

    await mkdir(this.uploadsDir, { recursive: true });
    const filename = `${randomUUID()}.webp`;
    await writeFile(join(this.uploadsDir, filename), webp);
    return `/uploads/${filename}`;
  }
}
