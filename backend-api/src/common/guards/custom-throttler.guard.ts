import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();

    // Skip throttling for all admin routes entirely
    if (req.url && (req.url.startsWith('/api/admin') || req.url.startsWith('/admin'))) {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}

