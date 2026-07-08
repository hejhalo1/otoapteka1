import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RegistryResource {
  id: string;
  format: string;
  dataDate: string | null;
  fileUrl: string | null;
  downloadUrl: string | null;
  fileSize: number | null;
}

const DATASET_ID = 1925;
const API_BASE = 'https://api.dane.gov.pl/1.4';
// SSRF-whitelist: metadane i pliki są na tym samym hoście.
const ALLOWED_HOSTS = new Set(['api.dane.gov.pl']);
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
const DOWNLOAD_TIMEOUT_MS = 300_000;
const METADATA_TIMEOUT_MS = 30_000;

@Injectable()
export class RegistryClientService {
  private readonly logger = new Logger(RegistryClientService.name);

  constructor(private readonly config: ConfigService) {}

  private assertAllowedHost(rawUrl: string): URL {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.host)) {
      throw new Error(
        `SSRF-guard: niedozwolony host/protokół: ${url.protocol}//${url.host}`,
      );
    }
    return url;
  }

  /** Pobiera listę zasobów datasetu (JSON:API). */
  async listResources(): Promise<RegistryResource[]> {
    const url = this.assertAllowedHost(
      `${API_BASE}/datasets/${DATASET_ID}/resources?per_page=50`,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Metadane zasobów: HTTP ${res.status}`);
      const json = (await res.json()) as {
        data?: Array<{ id: string; attributes?: Record<string, unknown> }>;
      };
      const data = json.data ?? [];
      return data.map((r) => {
        const a = r.attributes ?? {};
        return {
          id: r.id,
          format: typeof a.format === 'string' ? a.format.toLowerCase() : '',
          dataDate: (a.data_date as string) ?? null,
          fileUrl: (a.file_url as string) ?? null,
          downloadUrl: (a.download_url as string) ?? null,
          fileSize: (a.file_size as number) ?? null,
        };
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Wybiera najświeższy zasób z danymi:
   * 1. odrzuca format html (linki do wyszukiwarki) i zasoby bez file_url,
   * 2. spośród reszty (csv/xls/xml) bierze największą data_date — NIE preferuje formatu.
   */
  pickFreshestResource(resources: RegistryResource[]): RegistryResource {
    const candidates = resources.filter(
      (r) => r.format !== 'html' && r.fileUrl,
    );
    if (candidates.length === 0) {
      throw new Error('Brak zasobów z danymi (same html lub brak file_url).');
    }
    candidates.sort((a, b) =>
      String(b.dataDate ?? '').localeCompare(String(a.dataDate ?? '')),
    );
    const chosen = candidates[0];
    this.logger.log(
      `Wybrany zasób: id=${chosen.id} format=${chosen.format} data_date=${chosen.dataDate} rozmiar=${chosen.fileSize}`,
    );

    if (chosen.dataDate) {
      const ageDays =
        (Date.now() - new Date(chosen.dataDate).getTime()) / 86_400_000;
      if (ageDays > 7) {
        this.logger.warn(
          `Najświeższy zasób ma ${ageDays.toFixed(1)} dni — dane mogą być nieaktualne.`,
        );
      }
    }
    return chosen;
  }

  /** Pobiera plik do bufora (SSRF-guard, limit rozmiaru i czasu, bez redirectów poza whitelistę). */
  async downloadFile(
    fileUrl: string,
  ): Promise<{ buffer: Buffer; contentType: string | null }> {
    const url = this.assertAllowedHost(fileUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: 'error',
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Pobieranie pliku: HTTP ${res.status}`);

      const declared = Number(res.headers.get('content-length') ?? '0');
      if (declared && declared > MAX_FILE_BYTES) {
        throw new Error(`Plik za duży: ${declared} B > ${MAX_FILE_BYTES} B`);
      }
      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_FILE_BYTES) {
        throw new Error(
          `Plik za duży po pobraniu: ${arrayBuffer.byteLength} B`,
        );
      }
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: res.headers.get('content-type'),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
