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
      throw err || new UnauthorizedException('Geçersiz token veya oturum bulunamadı.');
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
