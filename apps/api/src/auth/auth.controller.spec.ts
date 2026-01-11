import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtPayload } from '@vmekala/data';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 'org-1',
    roles: ['ADMIN'],
    permissions: ['CREATE_TASK', 'READ_TASK'],
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login', () => {
    it('should return access token and user data', async () => {
      const mockRequest = { user: mockUser };
      const expectedResponse = {
        access_token: 'mock-jwt-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should handle login with different roles', async () => {
      const ownerUser = { ...mockUser, roles: ['OWNER'] };
      const mockRequest = { user: ownerUser };
      const expectedResponse = {
        access_token: 'mock-jwt-token',
        user: ownerUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(mockRequest);

      expect(result.user.roles).toEqual(['OWNER']);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return current user profile', async () => {
      const result = await controller.getProfile(mockJwtPayload);

      expect(result).toEqual(mockJwtPayload);
    });

    it('should return profile for different user types', async () => {
      const viewerPayload: JwtPayload = {
        ...mockJwtPayload,
        roles: ['VIEWER'],
        permissions: ['READ_TASK'],
      };

      const result = await controller.getProfile(viewerPayload);

      expect(result.roles).toEqual(['VIEWER']);
      expect(result.permissions).toEqual(['READ_TASK']);
    });
  });

  describe('GET /auth/validate', () => {
    it('should validate token and return user data', async () => {
      const result = await controller.validateToken(mockJwtPayload);

      expect(result).toEqual({
        valid: true,
        user: mockJwtPayload,
      });
    });

    it('should return valid true for any authenticated user', async () => {
      const differentUser: JwtPayload = {
        userId: 'user-2',
        email: 'another@example.com',
        organizationId: 'org-2',
        roles: ['VIEWER'],
        permissions: ['READ_TASK'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await controller.validateToken(differentUser);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(differentUser);
    });
  });
});
