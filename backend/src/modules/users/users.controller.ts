import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @RequirePermissions('users.read', '*')
  findAll() {
    return this.users.findAll();
  }

  @Get('roles')
  @RequirePermissions('roles.read', '*')
  getRoles() {
    return this.users.getRoles();
  }

  @Get('permissions')
  @RequirePermissions('permissions.read', '*')
  getPermissions() {
    return this.users.getPermissions();
  }

  @Get(':id')
  @RequirePermissions('users.read', '*')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }
}
