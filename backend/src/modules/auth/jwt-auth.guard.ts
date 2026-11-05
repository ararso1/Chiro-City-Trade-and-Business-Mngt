import { Injectable, UnauthorizedException, HttpException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any, info: any, _context: ExecutionContext): TUser {
    if (err) throw err;
    if (info instanceof HttpException) throw info;
    if (user) return user;
    if (info?.name === 'TokenExpiredError') throw new UnauthorizedException('Your Chiro Auth session expired. Sign out and sign in again.');
    if (info?.message?.startsWith('jwt audience invalid')) throw new UnauthorizedException('This token is missing the cctbm-api audience. Check the cctbm-web audience mapper in Chiro Auth.');
    if (info?.message?.startsWith('jwt issuer invalid')) throw new UnauthorizedException('This token was issued by a different Chiro Auth realm.');
    if (info?.name === 'NotBeforeError') throw new UnauthorizedException('This token is not valid yet. Check the backend and Chiro Auth server clocks.');
    throw new UnauthorizedException('A valid Chiro Auth access token is required. Sign out and sign in again.');
  }
}
