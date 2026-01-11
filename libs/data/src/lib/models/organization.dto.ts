export interface OrganizationDto {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  description?: string;
}
