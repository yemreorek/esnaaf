import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ActiveAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (user && user.role === 'service_provider' && user.accountStatus === 'pending_approval') {
      throw new ForbiddenException('Hesap onay sürecindedir. Bu işlemi gerçekleştiremezsiniz.');
    }

    return true;
  }
}
