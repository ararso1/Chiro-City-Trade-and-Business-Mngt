import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Don't connect here so the server can start even if DB credentials are wrong.
    // Prisma will connect on first query. Fix DATABASE_URL in .env and restart if you see P1000.
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
