import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('complaints')
@ApiBearerAuth()
@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private complaints: ComplaintsService) {}

  @Post()
  create(
    @Body()
    body: {
      traderId?: string;
      submittedBy: string;
      contactPhone?: string;
      contactEmail?: string;
      subject: string;
      description: string;
      category?: string;
    },
  ) {
    return this.complaints.create(body);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('complaints.read', '*')
  findAll(
    @Query('status') status?: string,
    @Query('traderId') traderId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.complaints.findAll({
      status,
      traderId,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('complaints.read', '*')
  findOne(@Param('id') id: string) {
    return this.complaints.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('complaints.update', '*')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      status?: string;
      assignedToId?: string;
      resolution?: string;
      resolvedAt?: string;
      followUpNotes?: string;
    },
  ) {
    const data: any = { ...body };
    if (body.resolvedAt) data.resolvedAt = new Date(body.resolvedAt);
    return this.complaints.update(id, data);
  }
}
