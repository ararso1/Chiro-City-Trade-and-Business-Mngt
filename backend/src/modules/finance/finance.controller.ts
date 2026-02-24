import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private finance: FinanceService) {}

  @Get('tax-types')
  @RequirePermissions('payments.read', 'finance.read', '*')
  getTaxTypes() {
    return this.finance.getTaxTypes();
  }

  @Get('payments')
  @RequirePermissions('payments.read', 'finance.read', '*')
  getPayments(
    @Query('businessId') businessId?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.finance.getPayments({
      businessId,
      year: year ? parseInt(year, 10) : undefined,
      status,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('revenue')
  @RequirePermissions('payments.read', 'reports.read', '*')
  getRevenueSummary(@Query('year') year?: string) {
    return this.finance.getRevenueSummary(year ? parseInt(year, 10) : undefined);
  }

  @Post('payments')
  @RequirePermissions('payments.create', 'finance.write', '*')
  recordPayment(
    @Body()
    body: {
      businessId: string;
      taxTypeId?: string;
      amount: number;
      year: number;
      period?: string;
      reference?: string;
      notes?: string;
    },
  ) {
    return this.finance.recordPayment(body);
  }
}
