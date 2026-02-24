import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessesController {
  constructor(private businesses: BusinessesService) {}

  @Post()
  @RequirePermissions('businesses.create', '*')
  create(@Body() dto: CreateBusinessDto) {
    return this.businesses.create(dto);
  }

  @Get()
  @RequirePermissions('businesses.read', '*')
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('traderId') traderId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.businesses.findAll({
      search,
      status,
      traderId,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('businesses.read', '*')
  findOne(@Param('id') id: string) {
    return this.businesses.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('businesses.update', '*')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businesses.update(id, dto);
  }
}
