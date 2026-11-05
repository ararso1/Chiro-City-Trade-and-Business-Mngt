import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { RolesService } from "./roles.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import {
  RequirePermissions,
  AnyPermissions,
} from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import {
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
} from "./management.dto";
@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private users: UsersService,
    private roles: RolesService,
  ) {}
  @Get() @RequirePermissions("users.read") findAll() {
    return this.users.findAll();
  }
  @Get("roles") @RequirePermissions("roles.read") getRoles() {
    return this.roles.findAll();
  }
  @Get("assignable-roles")
  @AnyPermissions("users.create", "users.update")
  assignable(@CurrentUser() actor: any) {
    return this.users.assignable(actor);
  }
  @Get("permissions") @RequirePermissions("permissions.read") getPermissions() {
    return this.users.getPermissions();
  }
  @Post("roles/sync") @RequirePermissions("roles.create") sync() {
    return this.roles.sync();
  }
  @Post("roles") @RequirePermissions("roles.create") createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() actor: any,
  ) {
    return this.roles.create(dto, actor);
  }
  @Put("roles/:id") @RequirePermissions("roles.update") updateRole(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: any,
  ) {
    return this.roles.update(id, dto, actor);
  }
  @Delete("roles/:id") @RequirePermissions("roles.delete") deleteRole(
    @Param("id") id: string,
    @CurrentUser() actor: any,
  ) {
    return this.roles.remove(id, actor);
  }
  @Get(":id") @RequirePermissions("users.read") findOne(
    @Param("id") id: string,
  ) {
    return this.users.findOne(id);
  }
  @Post() @RequirePermissions("users.create") create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: any,
  ) {
    return this.users.create(dto, actor);
  }
  @Put(":id") @RequirePermissions("users.update") update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: any,
  ) {
    return this.users.update(id, dto, actor);
  }
  @Delete(":id") @RequirePermissions("users.update") remove(
    @Param("id") id: string,
    @CurrentUser() actor: any,
  ) {
    return this.users.remove(id, actor);
  }
}
