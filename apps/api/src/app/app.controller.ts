import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@vmekala/data';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  /**
   * Example protected route
   * Requires JWT token in Authorization header
   */
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtectedData(@CurrentUser() user: JwtPayload) {
    return {
      message: 'This is protected data',
      user: {
        userId: user.userId,
        email: user.email,
        organizationId: user.organizationId,
        roles: user.roles,
        permissions: user.permissions,
      },
      data: this.appService.getData(),
    };
  }
}
