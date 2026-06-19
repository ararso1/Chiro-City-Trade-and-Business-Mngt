import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TradersService } from './traders.service';
import { BulkImportTradersDto, CreateTraderDto, UpdateTraderDto } from './dto/trader.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('traders')
@ApiBearerAuth()
@Controller('traders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TradersController {
  constructor(private traders: TradersService) {}

  @Post()
  @RequirePermissions('traders.create', '*')
  create(@Body() dto: CreateTraderDto, @CurrentUser('sub') userId?: string) {
    return this.traders.create(dto, userId);
  }

  @Post('bulk-import')
  @RequirePermissions('traders.create', '*')
  bulkImport(@Body() body: BulkImportTradersDto, @CurrentUser('sub') userId?: string) {
    return this.traders.bulkImport(body.traders, userId);
  }

  @Get()
  @RequirePermissions('traders.read', '*')
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('typeOfJob') typeOfJob?: string,
    @Query('category') category?: string,
    @Query('address') address?: string,
    @Query('licenseState') licenseState?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.traders.findAll({
      search,
      status,
      typeOfJob,
      category,
      address,
      licenseState,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('filter-options')
  @RequirePermissions('traders.read', '*')
  filterOptions() {
    return this.traders.getFilterOptions();
  }

  @Get(':id')
  @RequirePermissions('traders.read', '*')
  findOne(@Param('id') id: string) {
    return this.traders.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('traders.update', '*')
  update(@Param('id') id: string, @Body() dto: UpdateTraderDto) {
    return this.traders.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('traders.delete')
  remove(@Param('id') id: string) {
    return this.traders.remove(id);
  }
}
