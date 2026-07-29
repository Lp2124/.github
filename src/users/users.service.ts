import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { toSafeUser, type SafeUser } from './user.presenter';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAuthUserById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt || user.status === UserStatus.DELETED) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
    };
  }

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await this.findExistingUser(userId);
    return toSafeUser(user);
  }

  async updateCurrentUser(userId: string, dto: UpdateUserDto): Promise<SafeUser> {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (existing && existing.id !== userId) throw new ConflictException('Email is already in use');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto.email ? { email: dto.email.toLowerCase(), emailVerified: false } : {},
    });
    return toSafeUser(user);
  }

  async deactivateCurrentUser(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DEACTIVATED, deletedAt: new Date() },
    });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return toSafeUser(user);
  }

  private async findExistingUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    return user;
  }
}
