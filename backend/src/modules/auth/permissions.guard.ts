import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());
    if (!required?.length) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user?.permissions) throw new ForbiddenException('Access denied');
    const hasAll = required.every(
      (p) => user.permissions.includes(p) || user.permissions.includes('*'),
    );
    if (!hasAll) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
