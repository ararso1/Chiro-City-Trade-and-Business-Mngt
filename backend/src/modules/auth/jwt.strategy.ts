import { profile } from './access';
import { keycloakKeys } from './keycloak-keys';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { authConfig } from './auth.config';
import { KeycloakUserService } from './keycloak-user.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
    private central: KeycloakUserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      ...(authConfig().mode==='keycloak' ? { algorithms:['RS256'], issuer:authConfig().issuer, audience:authConfig().audience, secretOrKeyProvider:passportJwtSecret({cache:true,rateLimit:true,jwksRequestsPerMinute:10,fetcher:keycloakKeys,jwksUri:authConfig().issuer+'/protocol/openid-connect/certs'}) } : {algorithms:['HS256'],secretOrKey:config.get('JWT_SECRET') || 'chiro-city-trade-secret-change-in-production'}),
    });
  }

  async validate(payload: JwtPayload) {
    return profile(this.prisma,authConfig().mode==='keycloak' ? await this.central.resolve(payload) : payload.sub);
  }
}
