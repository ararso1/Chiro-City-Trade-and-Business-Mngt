import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';
import { CreateLicenseDto, UpdateLicenseDto } from './dto/license.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('licenses')
@ApiBearerAuth()
@Controller('licenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LicensesController {
  constructor(private licenses: LicensesService) {}

  @Post()
  @RequirePermissions('licenses.create', '*')
  create(@Body() dto: CreateLicenseDto) {
    return this.licenses.create(dto);
  }

  @Get()
  @RequirePermissions('licenses.read', '*')
  findAll(
    @Query('businessId') businessId?: string,
    @Query('traderId') traderId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.licenses.findAll({
      businessId,
      traderId,
      status,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('licenses.read', '*')
  findOne(@Param('id') id: string) {
    return this.licenses.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('licenses.update', '*')
  update(@Param('id') id: string, @Body() dto: UpdateLicenseDto, @CurrentUser('sub') userId?: string) {
    const payload = { ...dto };
    if ((dto.status === 'issued' || dto.status?.toLowerCase() === 'active') && !dto.issuedById && userId) {
      (payload as any).issuedById = userId;
    }
    return this.licenses.update(id, payload);
  }

  @Post(':id/renew')
  @RequirePermissions('licenses.update', '*')
  renew(@Param('id') id: string, @Body() body: { year: number }, @CurrentUser('sub') userId?: string) {
    return this.licenses.renew(id, Number(body.year), userId);
  }

  @Delete(':id')
  @RequirePermissions('licenses.delete')
  remove(@Param('id') id: string) {
    return this.licenses.remove(id);
  }
}
