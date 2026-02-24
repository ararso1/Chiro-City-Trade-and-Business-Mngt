import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FiscalYearService } from './fiscal-year.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('fiscal-year')
@ApiBearerAuth()
@Controller('fiscal-year')
@UseGuards(JwtAuthGuard)
export class FiscalYearController {
  constructor(private fiscalYear: FiscalYearService) {}

  @Get('config')
  getConfig() {
    return this.fiscalYear.getConfig();
  }

  @Get('active-range')
  getActiveRange() {
    return this.fiscalYear.getActiveDateRange();
  }

  @Put('config')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('*')
  setConfig(@Body() body: { calendarType?: 'EC' | 'GC'; activeFiscalYearId?: string | null }) {
    return this.fiscalYear.setConfig(
      body.calendarType ?? 'GC',
      body.activeFiscalYearId ?? null,
    );
  }

  @Get('list')
  list(@Query('calendarType') calendarType?: 'EC' | 'GC') {
    return this.fiscalYear.listFiscalYears(
      calendarType === 'EC' || calendarType === 'GC' ? calendarType : undefined,
    );
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('*')
  create(
    @Body()
    body: {
      calendarType: 'EC' | 'GC';
      label: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.fiscalYear.createFiscalYear({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('*')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
    },
  ) {
    const data: any = { ...body };
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate) data.endDate = new Date(body.endDate);
    return this.fiscalYear.updateFiscalYear(id, data);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('*')
  delete(@Param('id') id: string) {
    return this.fiscalYear.deleteFiscalYear(id);
  }
}
