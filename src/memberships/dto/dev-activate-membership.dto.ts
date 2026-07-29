import { IsOptional, IsUUID } from 'class-validator';

export class DevActivateMembershipDto {
  @IsOptional()
  @IsUUID()
  planId?: string;
}
