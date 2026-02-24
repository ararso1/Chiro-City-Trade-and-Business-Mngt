import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface FiscalDateRange {
  startDate: Date;
  endDate: Date;
  fiscalYearId: string;
  label: string;
  calendarType: string;
}

@Injectable()
export class FiscalYearService {
  constructor(private prisma: PrismaService) {}

  /** Get active system config: calendar type and active fiscal year id (empty = all time) */
  async getConfig(): Promise<{ calendarType: 'EC' | 'GC'; activeFiscalYearId: string | null }> {
    const [calendarRow, activeRow] = await Promise.all([
      this.prisma.systemConfig.findUnique({ where: { key: 'fiscal_calendar_type' } }),
      this.prisma.systemConfig.findUnique({ where: { key: 'active_fiscal_year_id' } }),
    ]);
    const calendarType = (calendarRow?.value === 'EC' || calendarRow?.value === 'GC') ? calendarRow.value : 'GC';
    const activeFiscalYearId = activeRow?.value?.trim() || null;
    return { calendarType, activeFiscalYearId };
  }

  /** Get date range for the active fiscal year. Returns null if "all time". */
  async getActiveDateRange(): Promise<FiscalDateRange | null> {
    const { activeFiscalYearId } = await this.getConfig();
    if (!activeFiscalYearId) return null;
    const fy = await this.prisma.fiscalYear.findUnique({
      where: { id: activeFiscalYearId },
    });
    if (!fy) return null;
    return {
      startDate: fy.startDate,
      endDate: fy.endDate,
      fiscalYearId: fy.id,
      label: fy.label,
      calendarType: fy.calendarType,
    };
  }

  /** Returns a Prisma date filter for createdAt/paidAt etc. Use in where: { createdAt: dateFilter } */
  async getDateFilterFor(field: 'createdAt' | 'paidAt' | 'conductedAt' | 'scheduledAt' = 'createdAt') {
    const range = await this.getActiveDateRange();
    if (!range) return undefined;
    return {
      gte: range.startDate,
      lte: range.endDate,
    };
  }

  async setConfig(calendarType: 'EC' | 'GC', activeFiscalYearId: string | null) {
    await this.prisma.$transaction([
      this.prisma.systemConfig.upsert({
        where: { key: 'fiscal_calendar_type' },
        create: { key: 'fiscal_calendar_type', value: calendarType },
        update: { value: calendarType },
      }),
      this.prisma.systemConfig.upsert({
        where: { key: 'active_fiscal_year_id' },
        create: { key: 'active_fiscal_year_id', value: activeFiscalYearId ?? '' },
        update: { value: activeFiscalYearId ?? '' },
      }),
    ]);
    return this.getConfig();
  }

  async listFiscalYears(calendarType?: 'EC' | 'GC') {
    const where = calendarType ? { calendarType } : {};
    return this.prisma.fiscalYear.findMany({
      where,
      orderBy: [{ startDate: 'desc' }],
    });
  }

  async createFiscalYear(data: {
    calendarType: 'EC' | 'GC';
    label: string;
    startDate: Date;
    endDate: Date;
  }) {
    return this.prisma.fiscalYear.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async updateFiscalYear(
    id: string,
    data: { label?: string; startDate?: Date; endDate?: Date; isActive?: boolean },
  ) {
    const update: any = { ...data };
    if (data.startDate) update.startDate = new Date(data.startDate);
    if (data.endDate) update.endDate = new Date(data.endDate);
    return this.prisma.fiscalYear.update({ where: { id }, data: update });
  }

  async deleteFiscalYear(id: string) {
    return this.prisma.fiscalYear.delete({ where: { id } });
  }
}
