import { Injectable, Logger } from '@nestjs/common';
import { SecurityEventType, SecuritySeverity } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface SecurityEventInput {
  userId?: string;
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

function hashOptional(value?: string): string | undefined {
  if (!value) return undefined;
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class SecurityEventsService {
  private readonly logger = new Logger(SecurityEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: SecurityEventInput): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId: input.userId,
          eventType: input.eventType,
          severity: input.severity ?? SecuritySeverity.LOW,
          ipAddress: hashOptional(input.ipAddress),
          userAgent: hashOptional(input.userAgent),
          metadata: input.metadata,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Failed to write security event: ${message}`);
    }
  }
}
