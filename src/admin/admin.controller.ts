import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  health() {
    return this.adminService.health();
  }

  @Get('users')
  users(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }
}
