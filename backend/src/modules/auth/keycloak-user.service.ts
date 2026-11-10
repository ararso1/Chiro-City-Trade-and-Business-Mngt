import { IdentityLifecycle } from './identity-lifecycle';
import { grants } from './access';
import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { authConfig } from './auth.config';
@Injectable()
export class KeycloakUserService {
 constructor(private prisma: PrismaService) {}
 async resolve(payload: any) {
  const cfg=authConfig();
  if(typeof payload.sub!=='string' || !payload.sub || payload.sub.length>255 || payload.azp!==cfg.clientId || payload.typ!=='Bearer' || !Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) throw new UnauthorizedException('Invalid Chiro Auth access token.');
  const names=payload.resource_access?.[cfg.audience]?.roles;
  if(!Array.isArray(names)||!names.every(n=>typeof n==='string'))throw new ForbiddenException('Your account has not been granted access to CCTBM.');
  const access=await grants(this.prisma,names);
  if(!access.roles.length)throw new ForbiddenException('Your account has not been granted access to CCTBM.');
  const roleName=access.roles[0];
  if(payload.email_verified!==true) throw new ForbiddenException('Verify your email address in Chiro Auth before accessing CCTBM.');
  if(typeof payload.email!=='string' || payload.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new ForbiddenException('A valid email is required.');
    await new IdentityLifecycle(cfg).assertActive(payload.sub);
  const role=await this.prisma.role.findUnique({where:{name:roleName}});
  if(!role) throw new ForbiddenException('Application role is not configured.');
  let user=await this.prisma.user.findUnique({where:{keycloakSub:payload.sub}});
  if(user && (!user.isActive || user.keycloakIssuer!==cfg.issuer)) throw new ForbiddenException('This application account is disabled or belongs to another issuer.');
  if(user && payload.iat<Number(user.rolesValidAfter))throw new UnauthorizedException('Your roles changed. Sign out and sign in again.');
  if(!user) {
   const conflict=await this.prisma.user.findFirst({where:{email:{equals:payload.email,mode:'insensitive'}}});
   if(conflict) throw new ForbiddenException('An existing account must be linked by an administrator.');
   try { user=await this.prisma.user.create({data:{email:payload.email.toLowerCase(),name:String(payload.name || payload.preferred_username || payload.email).slice(0,200),passwordHash:'!chiro-auth-only',keycloakSub:payload.sub,keycloakIssuer:cfg.issuer,roleId:role.id,roleNames:access.roles}}); }
   catch(e) { if((e as any).code==='P2002') throw new ForbiddenException('Identity conflict. Contact your administrator.'); throw e; }
  } else if(user.roleId!==role.id || JSON.stringify(user.roleNames)!==JSON.stringify(access.roles)) user=await this.prisma.user.update({where:{id:user.id},data:{roleId:role.id,roleNames:access.roles}});
  return user.id;
 }
}
