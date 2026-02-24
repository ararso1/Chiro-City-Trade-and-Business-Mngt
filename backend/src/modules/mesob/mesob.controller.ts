import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MesobService } from './mesob.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('mesob')
@ApiBearerAuth()
@Controller('mesob')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MesobController {
  constructor(private mesob: MesobService) {}

  @Post('sync/trader/:id')
  @RequirePermissions('*')
  pushTrader(@Param('id') id: string) {
    return this.mesob.pushToMesob('trader', id);
  }

  @Post('sync/business/:id')
  @RequirePermissions('*')
  pushBusiness(@Param('id') id: string) {
    return this.mesob.pushToMesob('business', id);
  }
}
