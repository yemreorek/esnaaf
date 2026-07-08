import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

const cookieExtractor = (req: any) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['esnaaf_token'];
  }
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
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

    if (!user || !user.is_active || user.deleted_at) {
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
