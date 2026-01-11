/**
 * Audit Log DTO
 */
export interface AuditLogDto {
  id: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  userId: string;
  organizationId: string;
  resource: 'Task' | 'User' | 'Organization';
  resourceId: string;
  timestamp: Date;
  changes?: Record<string, any>;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}
