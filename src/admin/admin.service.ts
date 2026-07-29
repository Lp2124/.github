import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeUser, type SafeUser } from '../users/user.presenter';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

export interface PaginatedUsers {
  items: SafeUser[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  health(): { status: string; admin: boolean } {
    return { status: 'ok', admin: true };
  }

  async listUsers(query: ListUsersQueryDto): Promise<PaginatedUsers> {
    const page = query.page;
    const limit = query.limit;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { role: { not: UserRole.SUPER_ADMIN } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where: { role: { not: UserRole.SUPER_ADMIN } } }),
    ]);
    return { items: users.map(toSafeUser), page, limit, total };
  }
}
