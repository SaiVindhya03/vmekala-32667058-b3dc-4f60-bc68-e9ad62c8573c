export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}
