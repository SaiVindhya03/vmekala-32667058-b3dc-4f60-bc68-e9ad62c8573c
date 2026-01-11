import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

// Mock bcrypt module
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let userRoleRepository: Repository<UserRole>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 'org-1',
    organization: { id: 'org-1', name: 'Test Org' },
  };

  const mockUserRoles = [
    {
      userId: 'user-1',
      roleId: 'role-1',
      role: {
        id: 'role-1',
        name: 'ADMIN',
        permissions: [
          { id: 'perm-1', name: 'CREATE_TASK' },
          { id: 'perm-2', name: 'READ_TASK' },
        ],
      },
    },
  ];

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRoleRepository = {
    find: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userRoleRepository = module.get<Repository<UserRole>>(
      getRepositoryToken(UserRole)
    );
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const bcrypt = require('bcryptjs');
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRoleRepository.find.mockResolvedValue(mockUserRoles);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.roles).toEqual(['ADMIN']);
      expect(result?.permissions).toEqual(['CREATE_TASK', 'READ_TASK']);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const bcrypt = require('bcryptjs');
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should handle users with no roles', async () => {
      const bcrypt = require('bcryptjs');
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRoleRepository.find.mockResolvedValue([]);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result?.roles).toEqual([]);
      expect(result?.permissions).toEqual([]);
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'org-1',
        roles: ['ADMIN'],
        permissions: ['CREATE_TASK', 'READ_TASK'],
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(userData);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: userData,
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
        roles: ['ADMIN'],
        permissions: ['CREATE_TASK', 'READ_TASK'],
      });
    });

    it('should handle user with empty roles/permissions', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'org-1',
        roles: [],
        permissions: [],
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(userData);

      expect(result.user.roles).toEqual([]);
      expect(result.user.permissions).toEqual([]);
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const bcrypt = require('bcryptjs');
      const password = 'password123';
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedpassword123');

      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      const bcrypt = require('bcryptjs');
      const password = 'password123';
      const hash = 'hashedpassword';
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.verifyPassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for non-matching password', async () => {
      const bcrypt = require('bcryptjs');
      const password = 'password123';
      const hash = 'hashedpassword';
      bcrypt.compare.mockResolvedValue(false);

      const result = await service.verifyPassword(password, hash);

      expect(result).toBe(false);
    });
  });
});
