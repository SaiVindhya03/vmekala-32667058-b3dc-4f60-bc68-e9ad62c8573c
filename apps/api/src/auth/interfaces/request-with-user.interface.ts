export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    organizationId: string;
    roles: string[];
    permissions: string[];
  };
}
