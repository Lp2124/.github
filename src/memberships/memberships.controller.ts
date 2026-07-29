import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { DevActivateMembershipDto } from './dto/dev-activate-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Public()
  @Get('plans')
  getPlans() {
    return this.membershipsService.getPlans();
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.getCurrent(user.id);
  }

  @Post('dev-activate')
  devActivate(@CurrentUser() user: AuthenticatedUser, @Body() dto: DevActivateMembershipDto) {
    return this.membershipsService.devActivate(user.id, dto);
  }
}
