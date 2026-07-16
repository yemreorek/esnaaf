import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

const cookieExtractor = (req: any) => {
  let token = null;
  if (req && req.headers.authorization) {
    const authHeaderParts = req.headers.authorization.split(' ');
    if (authHeaderParts.length === 2 && authHeaderParts[1] !== 'active') {
      token = authHeaderParts[1];
    }
  }
  if (!token && req && req.cookies) {
    token = req.cookies['esnaaf_token'];
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_min_32_characters',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { service_provider: true },
    });

    if (!user) {
      console.error(`[JwtStrategy] Unauthorized: User not found for id ${payload.sub}`);
      throw new UnauthorizedException('Geçersiz token veya inaktif kullanıcı.');
    }
    if (!user.is_active) {
      console.error(`[JwtStrategy] Unauthorized: User ${user.id} is not active`);
      throw new UnauthorizedException('Geçersiz token veya inaktif kullanıcı.');
    }
    if (user.deleted_at) {
      console.error(`[JwtStrategy] Unauthorized: User ${user.id} is deleted`);
      throw new UnauthorizedException('Geçersiz token veya inaktif kullanıcı.');
    }

    return {
      id: user.id,
      phone: user.phone,
      phone_masked: user.phone_masked,
      name: user.name,
      email: user.email,
      role: user.role,
      kvkk_consent: user.kvkk_consent,
      isImpersonated: payload.isImpersonated || false,
      accountStatus: user.service_provider?.account_status || 'active',
    };
  }
}
