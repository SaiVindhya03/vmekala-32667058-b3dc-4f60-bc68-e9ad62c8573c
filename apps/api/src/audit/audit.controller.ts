import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditLogDto } from '@vmekala/data';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs for the current user's organization
   * @param req - Request with user information
   * @param resource - Optional filter by resource type
   * @param action - Optional filter by action type
   * @param userId - Optional filter by user ID
   * @returns Array of audit log entries
   */
  @Get()
  async getAuditLogs(
    @Request() req: any,
    @Query('resource') resource?: 'Task' | 'User' | 'Organization',
    @Query('action') action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    @Query('userId') userId?: string,
  ): Promise<AuditLogDto[]> {
    const organizationId = req.user.organizationId;

    const filters: any = {};
    if (resource) filters.resource = resource;
    if (action) filters.action = action;
    if (userId) filters.userId = userId;

    return this.auditService.getLogs(organizationId, filters);
  }
}
