import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@vmekala/data';

/**
 * Custom parameter decorator to extract the current user from the request
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 * ```
 * 
 * @returns The user object from request.user (set by JwtAuthGuard)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
