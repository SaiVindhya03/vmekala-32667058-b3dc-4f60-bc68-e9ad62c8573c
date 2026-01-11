import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

/**
 * Seed script to create test users with hashed passwords
 * Run with: npx ts-node apps/api/src/database/seeds/create-test-user.ts
 */

async function createTestUser() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: './database.db',
    entities: ['apps/api/src/entities/*.entity.ts'],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Check if organization exists
    const orgResult = await dataSource.query(
      'SELECT id FROM organizations LIMIT 1'
    );

    if (!orgResult || orgResult.length === 0) {
      console.error('No organization found. Please create an organization first.');
      return;
    }

    const organizationId = orgResult[0].id;

    // Create test user
    await dataSource.query(
      `INSERT INTO users (id, email, password, firstName, lastName, organizationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'test-user-uuid-1',
        'test@example.com',
        hashedPassword,
        'Test',
        'User',
        organizationId,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('Organization ID:', organizationId);

    // Check if roles exist and assign
    const roleResult = await dataSource.query(
      'SELECT id, name FROM roles LIMIT 1'
    );

    if (roleResult && roleResult.length > 0) {
      const roleId = roleResult[0].id;
      
      await dataSource.query(
        `INSERT INTO user_roles (id, userId, roleId, organizationId)
         VALUES (?, ?, ?, ?)`,
        [
          'test-user-role-uuid-1',
          'test-user-uuid-1',
          roleId,
          organizationId,
        ]
      );

      console.log('✅ User role assigned:', roleResult[0].name);
    }

  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      console.log('ℹ️  User already exists');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await dataSource.destroy();
  }
}

createTestUser();
