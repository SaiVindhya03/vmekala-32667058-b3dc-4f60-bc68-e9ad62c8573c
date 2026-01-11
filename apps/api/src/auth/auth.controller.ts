import { Controller, Post, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/auth.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from '@vmekala/data';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login
   * Authenticate with email and password
   * Returns JWT access token and user details
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@Request() req): Promise<LoginResponseDto> {
    // LocalAuthGuard validates credentials and attaches user to request
    return this.authService.login(req.user);
  }

  /**
   * GET /auth/profile
   * Get current user's profile (requires JWT token)
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload) {
    // JwtAuthGuard validates token and attaches user context to request
    return user;
  }

  /**
   * GET /auth/validate
   * Validate JWT token (requires JWT token)
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@CurrentUser() user: JwtPayload) {
    return {
      valid: true,
      user,
    };
  }
}
