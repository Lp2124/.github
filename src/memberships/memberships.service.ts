import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipStatus } from '@prisma/client';
import type { Membership, SubscriptionPlan } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AppConfig } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { DevActivateMembershipDto } from './dto/dev-activate-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly auditService: AuditService,
  ) {}

  getPlans(): Promise<SubscriptionPlan[]> {
    return this.prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { durationDays: 'asc' } });
  }

  async getCurrent(userId: string): Promise<Membership | null> {
    await this.expireMembershipsForUser(userId);
    return this.prisma.membership.findFirst({ where: { userId, deletedAt: null }, orderBy: { expiresAt: 'desc' } });
  }

  async hasActiveMembership(userId: string): Promise<boolean> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE, expiresAt: { gt: new Date() }, deletedAt: null },
      select: { id: true },
    });
    return Boolean(membership);
  }

  async devActivate(userId: string, dto: DevActivateMembershipDto): Promise<Membership> {
    if (this.configService.get('nodeEnv', { infer: true }) !== 'development') {
      throw new ForbiddenException('Development membership activation is disabled');
    }
    const plan = dto.planId
      ? await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } })
      : await this.prisma.subscriptionPlan.findFirst({ where: { active: true }, orderBy: { durationDays: 'asc' } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    await this.prisma.membership.updateMany({ where: { userId, status: MembershipStatus.ACTIVE }, data: { status: MembershipStatus.CANCELED, cancelledAt: new Date() } });
    const membership = await this.prisma.membership.create({
      data: {
        userId,
        planId: plan.id,
        status: MembershipStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + plan.durationDays * 86_400_000),
      },
    });
    await this.auditService.log({ actorUserId: userId, actionType: 'DEV_MEMBERSHIP_ACTIVATED', entityType: 'Membership', entityId: membership.id });
    return membership;
  }

  async expireMembershipsForUser(userId: string): Promise<void> {
    await this.prisma.membership.updateMany({
      where: { userId, status: MembershipStatus.ACTIVE, expiresAt: { lte: new Date() } },
      data: { status: MembershipStatus.EXPIRED },
    });
  }
}
