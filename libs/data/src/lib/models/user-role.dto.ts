import { Permission } from './permission.enum';

export interface UserRoleDto {
  userId: string;
  roleId: string;
  organizationId: string;
  permissions: Permission[];
}
