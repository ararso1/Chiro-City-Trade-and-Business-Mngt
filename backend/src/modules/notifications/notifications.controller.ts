import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findAll(
    @Query('traderId') traderId?: string,
    @Query('type') type?: string,
    @Query('read') read?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @CurrentUser('sub') userId?: string,
  ) {
    return this.notifications.findAll({
      userId,
      traderId,
      type,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('notifications.create', '*')
  create(
    @Body()
    body: {
      userId?: string;
      traderId?: string;
      type: string;
      title: string;
      body?: string;
      amount?: number;
      channel: string;
      metadata?: object;
    },
  ) {
    return this.notifications.create(body);
  }
}
