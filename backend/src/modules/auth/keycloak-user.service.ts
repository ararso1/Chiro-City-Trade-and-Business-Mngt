import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { authConfig } from './auth.config';
export function clientRole(payload: any): string {
 const roles=payload.resource_access?.[authConfig().audience]?.roles;
 if(!Array.isArray(roles)) throw new ForbiddenException('Your account has not been granted access to CCTBM.');
 for(const role of ['admin','officer','finance','trader']) if(roles.includes(role) || roles.includes(role.toUpperCase())) return role;
 throw new ForbiddenException('Your account has not been granted access to CCTBM.');
}
@Injectable()
export class KeycloakUserService {
 constructor(private prisma: PrismaService) {}
 async resolve(payload: any) {
  const cfg=authConfig();
  if(typeof payload.sub!=='string' || !payload.sub || payload.sub.length>255 || payload.azp!==cfg.clientId || payload.typ!=='Bearer' || !Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) throw new UnauthorizedException('Invalid Chiro Auth access token.');
  const roleName=clientRole(payload);
  if(payload.email_verified!==true) throw new ForbiddenException('Verify your email address in Chiro Auth before accessing CCTBM.');
  if(typeof payload.email!=='string' || payload.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw new ForbiddenException('A valid email is required.');
  const role=await this.prisma.role.findUnique({where:{name:roleName}});
  if(!role) throw new ForbiddenException('Application role is not configured.');
  let user=await this.prisma.user.findUnique({where:{keycloakSub:payload.sub}});
  if(user && (!user.isActive || user.keycloakIssuer!==cfg.issuer)) throw new ForbiddenException('This application account is disabled or belongs to another issuer.');
  if(!user) {
   const conflict=await this.prisma.user.findFirst({where:{email:{equals:payload.email,mode:'insensitive'}}});
   if(conflict) throw new ForbiddenException('An existing account must be linked by an administrator.');
   try { user=await this.prisma.user.create({data:{email:payload.email.toLowerCase(),name:String(payload.name || payload.preferred_username || payload.email).slice(0,200),passwordHash:'!chiro-auth-only',keycloakSub:payload.sub,keycloakIssuer:cfg.issuer,roleId:role.id}}); }
   catch(e) { if((e as any).code==='P2002') throw new ForbiddenException('Identity conflict. Contact your administrator.'); throw e; }
  } else if(user.roleId!==role.id) user=await this.prisma.user.update({where:{id:user.id},data:{roleId:role.id}});
  return user.id;
 }
}
