import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Placeholder for MESOB (mesob.ciroocity.com) integration. */
@Injectable()
export class MesobService {
  constructor(private prisma: PrismaService) {}

  async logSync(entity: string, entityId: string, direction: 'push' | 'pull', status: 'success' | 'failed', payload?: object, error?: string) {
    return this.prisma.mesobSyncLog.create({
      data: { entity, entityId, direction, status, payload: payload ?? undefined, error },
    });
  }

  /** Sync trader/business to MESOB - implement per MESOB API spec. */
  async pushToMesob(entity: 'trader' | 'business', id: string) {
    // TODO: call MESOB API (e.g. POST mesob.ciroocity.com/api/...)
    await this.logSync(entity, id, 'push', 'success', { id });
    return { synced: true, entity, id };
  }
}
