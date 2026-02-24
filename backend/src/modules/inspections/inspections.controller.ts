import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('inspections')
@ApiBearerAuth()
@Controller('inspections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InspectionsController {
  constructor(private inspections: InspectionsService) {}

  @Post()
  @RequirePermissions('inspections.create', '*')
  create(
    @Body() body: { businessId: string; scheduledAt: string; status?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.inspections.create({
      businessId: body.businessId,
      inspectorId: userId,
      scheduledAt: new Date(body.scheduledAt),
      status: body.status,
    });
  }

  @Get()
  @RequirePermissions('inspections.read', '*')
  findAll(
    @Query('businessId') businessId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.inspections.findAll({
      businessId,
      status,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('inspections.read', '*')
  findOne(@Param('id') id: string) {
    return this.inspections.findOne(id);
  }

  @Put(':id/result')
  @RequirePermissions('inspections.update', '*')
  updateResult(
    @Param('id') id: string,
    @Body() body: { conductedAt?: string; status?: string; result?: string; summary?: string },
  ) {
    const data: any = { ...body };
    if (body.conductedAt) data.conductedAt = new Date(body.conductedAt);
    return this.inspections.updateResult(id, data);
  }

  @Post(':id/violations')
  @RequirePermissions('inspections.update', '*')
  addViolation(
    @Param('id') id: string,
    @Body() body: { code: string; description: string; severity: string },
  ) {
    return this.inspections.addViolation(id, body);
  }
}
