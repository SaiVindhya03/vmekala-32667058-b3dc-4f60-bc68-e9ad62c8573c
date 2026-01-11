import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtPayload, Role } from '@vmekala/data';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getById: jest.fn(),
    toDto: jest.fn(),
    getUsersByOrganization: jest.fn(),
    toDtoArray: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 'org-1',
    createdAt: new Date(),
  };

  const mockJwtPayload: JwtPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
    roles: ['ADMIN'],
    permissions: ['CREATE_TASK', 'READ_TASK'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /users/profile', () => {
    it('should return current user profile', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.toDto.mockReturnValue(mockUser);

      const result = await controller.getProfile(mockJwtPayload);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.getById).toHaveBeenCalledWith('user-1');
      expect(mockUsersService.toDto).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user when in same organization', async () => {
      const targetUser = {
        ...mockUser,
        id: 'user-2',
        email: 'user2@example.com',
      };

      mockUsersService.getById.mockResolvedValue(targetUser);
      mockUsersService.toDto.mockReturnValue(targetUser);

      const result = await controller.getUserById('user-2', mockJwtPayload);

      expect(result).toEqual(targetUser);
      expect(mockUsersService.getById).toHaveBeenCalledWith('user-2');
    });

    it('should throw ForbiddenException when user is in different organization', async () => {
      const differentOrgUser = {
        ...mockUser,
        id: 'user-2',
        organizationId: 'org-2', // Different organization
      };

      mockUsersService.getById.mockResolvedValue(differentOrgUser);

      await expect(
        controller.getUserById('user-2', mockJwtPayload)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.getUserById('user-2', mockJwtPayload)
      ).rejects.toThrow('Access denied: User is not in your organization');
    });

    it('should allow user to access their own profile', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.toDto.mockReturnValue(mockUser);

      const result = await controller.getUserById('user-1', mockJwtPayload);

      expect(result).toEqual(mockUser);
    });
  });

  describe('GET /users/organization/:organizationId', () => {
    it('should return all users in organization for OWNER', async () => {
      const ownerPayload: JwtPayload = {
        ...mockJwtPayload,
        roles: ['OWNER'],
      };

      const orgUsers = [
        mockUser,
        { ...mockUser, id: 'user-2', email: 'user2@example.com' },
        { ...mockUser, id: 'user-3', email: 'user3@example.com' },
      ];

      mockUsersService.getUsersByOrganization.mockResolvedValue(orgUsers);
      mockUsersService.toDtoArray.mockReturnValue(orgUsers);

      const result = await controller.getUsersByOrganization('org-1');

      expect(result).toEqual(orgUsers);
      expect(mockUsersService.getUsersByOrganization).toHaveBeenCalledWith('org-1');
      expect(mockUsersService.toDtoArray).toHaveBeenCalledWith(orgUsers);
    });

    it('should return all users in organization for ADMIN', async () => {
      const adminPayload: JwtPayload = {
        ...mockJwtPayload,
        roles: ['ADMIN'],
      };

      const orgUsers = [mockUser];

      mockUsersService.getUsersByOrganization.mockResolvedValue(orgUsers);
      mockUsersService.toDtoArray.mockReturnValue(orgUsers);

      const result = await controller.getUsersByOrganization('org-1');

      expect(result).toEqual(orgUsers);
    });

    it('should return empty array when no users in organization', async () => {
      mockUsersService.getUsersByOrganization.mockResolvedValue([]);
      mockUsersService.toDtoArray.mockReturnValue([]);

      const result = await controller.getUsersByOrganization('org-1');

      expect(result).toEqual([]);
    });
  });
});
