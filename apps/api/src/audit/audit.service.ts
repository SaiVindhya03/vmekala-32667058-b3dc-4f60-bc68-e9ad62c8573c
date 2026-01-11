import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogDto } from '@vmekala/data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an action to the audit log
   * @param action - Action type: 'CREATE', 'READ', 'UPDATE', 'DELETE'
   * @param userId - ID of the user who performed the action
   * @param organizationId - ID of the organization
   * @param resource - Resource type: 'Task', 'User', 'Organization'
   * @param resourceId - ID of the affected resource
   * @param changes - Optional changes object with {oldValue, newValue} for updates
   */
  async log(
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    userId: string,
    organizationId: string,
    resource: 'Task' | 'User' | 'Organization',
    resourceId: string,
    changes?: Record<string, any>,
  ): Promise<AuditLog> {
    // Console log for development
    console.log('[AUDIT LOG]', {
      action,
      userId,
      organizationId,
      resource,
      resourceId,
      changes,
      timestamp: new Date().toISOString(),
    });

    // Create and save to database
    const auditLog = this.auditLogRepository.create({
      action,
      userId,
      organizationId,
      resource,
      resourceId,
      changes,
      timestamp: new Date(),
    });

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Get audit logs for an organization with optional filters
   * @param organizationId - Organization ID to fetch logs for
   * @param filters - Optional filters: userId, resource, action
   * @returns Array of AuditLog entries sorted by timestamp DESC
   */
  async getLogs(
    organizationId: string,
    filters?: {
      userId?: string;
      resource?: 'Task' | 'User' | 'Organization';
      action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    },
  ): Promise<AuditLogDto[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .leftJoinAndSelect('audit_log.organization', 'organization');

    // Filter by organizationId
    queryBuilder.where('audit_log.organizationId = :organizationId', {
      organizationId,
    });

    // Apply optional filters
    if (filters?.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters?.resource) {
      queryBuilder.andWhere('audit_log.resource = :resource', {
        resource: filters.resource,
      });
    }

    if (filters?.action) {
      queryBuilder.andWhere('audit_log.action = :action', {
        action: filters.action,
      });
    }

    // Sort by timestamp DESC
    queryBuilder.orderBy('audit_log.timestamp', 'DESC');

    const logs = await queryBuilder.getMany();
    return logs.map((log) => this.toDto(log));
  }

  /**
   * Get audit logs for a specific resource
   */
  async getLogsByResource(
    resource: string,
    resourceId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resource, resourceId },
      order: { timestamp: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getLogsByUser(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Convert AuditLog entity to AuditLogDto
   */
  private toDto(log: AuditLog): AuditLogDto {
    return {
      id: log.id,
      action: log.action as 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
      userId: log.userId,
      organizationId: log.organizationId,
      resource: log.resource as 'Task' | 'User' | 'Organization',
      resourceId: log.resourceId,
      timestamp: log.timestamp,
      changes: log.changes,
      user: log.user
        ? {
            id: log.user.id,
            email: log.user.email,
            firstName: log.user.firstName,
            lastName: log.user.lastName,
          }
        : undefined,
    };
  }
}
