import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Woła endpoint rewalidacji on-demand frontendu (Next.js ISR) po publikacji/synchronizacji.
// Fire-and-forget: błąd rewalidacji nie może wywalić operacji admina.
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);
  private readonly frontendUrl: string;
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.frontendUrl = (
      config.get<string>('FRONTEND_BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    this.secret = config.get<string>('REVALIDATE_SECRET') ?? '';
  }

  private async call(body: Record<string, unknown>): Promise<void> {
    if (!this.secret) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      await fetch(`${this.frontendUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: this.secret, ...body }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    } catch (e) {
      this.logger.warn(
        `Rewalidacja frontendu nie powiodła się: ${(e as Error).message}`,
      );
    }
  }

  async revalidatePharmacy(slug: string): Promise<void> {
    await this.call({ tag: `pharmacy:${slug}` });
  }

  async revalidateSlugs(): Promise<void> {
    await this.call({ tag: 'pharmacy-slugs' });
  }
}
