import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Task } from '../../entities/task.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');

  const organizationRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);
  const userRoleRepo = dataSource.getRepository(UserRole);
  const taskRepo = dataSource.getRepository(Task);

  // Check if data already exists
  const existingOrgs = await organizationRepo.count();
  if (existingOrgs > 0) {
    console.log('✅ Database already seeded, skipping...');
    return;
  }

  try {
    // 1. Create Roles
    console.log('Creating roles...');
    const ownerRole = roleRepo.create({ name: 'OWNER' });
    const adminRole = roleRepo.create({ name: 'ADMIN' });
    const viewerRole = roleRepo.create({ name: 'VIEWER' });
    await roleRepo.save([ownerRole, adminRole, viewerRole]);

    // 2. Create Permissions for each role
    console.log('Creating permissions...');
    const allPermissions = [
      'CREATE_TASK',
      'READ_TASK',
      'UPDATE_TASK',
      'DELETE_TASK',
      'VIEW_AUDIT_LOG',
    ];

    const adminPermissions = [
      'CREATE_TASK',
      'READ_TASK',
      'UPDATE_TASK',
      'DELETE_TASK',
      'VIEW_AUDIT_LOG',
    ];

    const viewerPermissions = ['READ_TASK'];

    // OWNER gets all permissions
    const ownerPermissionEntities = allPermissions.map((perm) =>
      permissionRepo.create({ name: perm, roleId: ownerRole.id })
    );
    await permissionRepo.save(ownerPermissionEntities);

    // ADMIN gets admin permissions
    const adminPermissionEntities = adminPermissions.map((perm) =>
      permissionRepo.create({ name: perm, roleId: adminRole.id })
    );
    await permissionRepo.save(adminPermissionEntities);

    // VIEWER gets viewer permissions
    const viewerPermissionEntities = viewerPermissions.map((perm) =>
      permissionRepo.create({ name: perm, roleId: viewerRole.id })
    );
    await permissionRepo.save(viewerPermissionEntities);

    // 3. Hash password (used for all users)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 4. Temporarily disable foreign key constraints to handle circular dependency
    console.log('Creating organizations and users...');
    await dataSource.query('PRAGMA foreign_keys = OFF');

    // Create Organizations without ownerId first (we'll update it later)
    const techCorpId = uuidv4();
    const designStudioId = uuidv4();
    
    // Save organizations without validation
    await dataSource.query(
      `INSERT INTO organizations (id, name, description, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [techCorpId, 'TechCorp', 'Technology company focusing on innovation', null]
    );
    await dataSource.query(
      `INSERT INTO organizations (id, name, description, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [designStudioId, 'DesignStudio', 'Creative design agency', null]
    );

    // 5. Create Users
    const user1 = userRepo.create({
      email: 'user1@techcorp.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      organizationId: techCorpId,
    });
    const user2 = userRepo.create({
      email: 'user2@techcorp.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      organizationId: techCorpId,
    });
    const user3 = userRepo.create({
      email: 'user3@techcorp.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Johnson',
      organizationId: techCorpId,
    });
    const designer1 = userRepo.create({
      email: 'designer1@designstudio.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Williams',
      organizationId: designStudioId,
    });
    const designer2 = userRepo.create({
      email: 'designer2@designstudio.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      organizationId: designStudioId,
    });

    await userRepo.save([user1, user2, user3, designer1, designer2]);

    // 6. Update organization owners
    console.log('Updating organization owners...');
    await dataSource.query(
      `UPDATE organizations SET ownerId = ? WHERE id = ?`,
      [user1.id, techCorpId]
    );
    await dataSource.query(
      `UPDATE organizations SET ownerId = ? WHERE id = ?`,
      [designer1.id, designStudioId]
    );

    // Re-enable foreign key constraints
    await dataSource.query('PRAGMA foreign_keys = ON');

    // 7. Assign roles to users
    console.log('Assigning roles to users...');
    const userRoles = [
      // TechCorp users
      userRoleRepo.create({
        userId: user1.id,
        roleId: ownerRole.id,
        organizationId: techCorpId,
      }),
      userRoleRepo.create({
        userId: user2.id,
        roleId: adminRole.id,
        organizationId: techCorpId,
      }),
      userRoleRepo.create({
        userId: user3.id,
        roleId: viewerRole.id,
        organizationId: techCorpId,
      }),
      // DesignStudio users
      userRoleRepo.create({
        userId: designer1.id,
        roleId: ownerRole.id,
        organizationId: designStudioId,
      }),
      userRoleRepo.create({
        userId: designer2.id,
        roleId: viewerRole.id,
        organizationId: designStudioId,
      }),
    ];
    await userRoleRepo.save(userRoles);

    // 8. Create Sample Tasks
    console.log('Creating sample tasks...');

    // TechCorp tasks (5)
    const techCorpTasks = [
      taskRepo.create({
        title: 'Setup development environment',
        description: 'Configure local development environment with all necessary tools',
        status: 'done',
        category: 'Development',
        organizationId: techCorpId,
        createdBy: user1.id,
      }),
      taskRepo.create({
        title: 'Implement authentication system',
        description: 'Build JWT-based authentication with role-based access control',
        status: 'in-progress',
        category: 'Development',
        organizationId: techCorpId,
        createdBy: user2.id,
      }),
      taskRepo.create({
        title: 'Write API documentation',
        description: 'Document all API endpoints with examples and response formats',
        status: 'todo',
        category: 'Documentation',
        organizationId: techCorpId,
        createdBy: user2.id,
      }),
      taskRepo.create({
        title: 'Code review for PR #42',
        description: 'Review pull request for new user management features',
        status: 'in-progress',
        category: 'Review',
        organizationId: techCorpId,
        createdBy: user3.id,
      }),
      taskRepo.create({
        title: 'Fix bug in task filtering',
        description: 'Tasks are not filtering correctly by status',
        status: 'todo',
        category: 'Bug Fix',
        organizationId: techCorpId,
        createdBy: user1.id,
      }),
    ];

    // DesignStudio tasks (3)
    const designStudioTasks = [
      taskRepo.create({
        title: 'Design new landing page',
        description: 'Create mockups for the new company landing page',
        status: 'in-progress',
        category: 'Design',
        organizationId: designStudioId,
        createdBy: designer1.id,
      }),
      taskRepo.create({
        title: 'Client presentation preparation',
        description: 'Prepare presentation deck for upcoming client meeting',
        status: 'todo',
        category: 'Business',
        organizationId: designStudioId,
        createdBy: designer1.id,
      }),
      taskRepo.create({
        title: 'Update brand guidelines',
        description: 'Refresh brand guidelines with new logo variations',
        status: 'done',
        category: 'Design',
        organizationId: designStudioId,
        createdBy: designer2.id,
      }),
    ];

    await taskRepo.save([...techCorpTasks, ...designStudioTasks]);

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  - Organizations: 2 (TechCorp, DesignStudio)');
    console.log('  - Roles: 3 (OWNER, ADMIN, VIEWER)');
    console.log('  - Users: 5');
    console.log('  - Tasks: 8 (5 TechCorp, 3 DesignStudio)');
    console.log('');
    console.log('🔐 Login credentials (all users):');
    console.log('  - Password: password123');
    console.log('  - TechCorp: user1@techcorp.com, user2@techcorp.com, user3@techcorp.com');
    console.log('  - DesignStudio: designer1@designstudio.com, designer2@designstudio.com');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
