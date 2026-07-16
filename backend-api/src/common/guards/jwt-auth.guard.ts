import { Injectable, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      console.error('[JwtAuthGuard] Auth failed. Error:', err, 'Info:', info ? info.message || info : 'none', 'User:', user);
      const infoMsg = info ? info.message || JSON.stringify(info) : 'none';
      throw err || new UnauthorizedException(`Auth failed: info=${infoMsg}, user=${JSON.stringify(user || null)}`);
    }

    const request = context.switchToHttp().getRequest();
    if (user.isImpersonated) {
      const method = request.method;
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        throw new ForbiddenException('Ön izleme (taklit) modundayken bu işlemi gerçekleştiremezsiniz.');
      }
    }

    return user;
  }
}
