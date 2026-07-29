import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { LocationDto } from './dto/location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.locationsService.getMe(user.id);
  }

  @Post('me')
  createMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: LocationDto) {
    return this.locationsService.createMe(user.id, dto);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateLocationDto) {
    return this.locationsService.updateMe(user.id, dto);
  }
}
