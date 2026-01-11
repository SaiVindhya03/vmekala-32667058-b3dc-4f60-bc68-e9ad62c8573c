import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Organization,
  Role,
  Permission,
  Task,
  UserRole,
  AuditLog,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // Parse database URL to determine connection type
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        // SQLite: accept sqlite:, sqlite://, sqlite3://
        if (
          databaseUrl.startsWith('sqlite:') ||
          databaseUrl.startsWith('sqlite://') ||
          databaseUrl.startsWith('sqlite3://')
        ) {
          const dbPath = databaseUrl
            .replace(/^sqlite3?:\/\//, '')
            .replace(/^sqlite:/, '');

          return {
            type: 'sqlite',
            database: dbPath || './database.db',
            synchronize: true,
            logging: true,
            entities: [User, Organization, Role, Permission, Task, UserRole, AuditLog],
          };
        }

        // MySQL: use url directly
        if (databaseUrl.startsWith('mysql://') || databaseUrl.startsWith('mysql2://')) {
          return {
            type: 'mysql',
            url: databaseUrl,
            synchronize: true,
            logging: true,
            entities: [User, Organization, Role, Permission, Task, UserRole, AuditLog],
          };
        }

        // Postgres: use url directly, add ssl if requested
        if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
          let ssl: any = false;
          try {
            const url = new URL(databaseUrl);
            if (url.searchParams.get('ssl') === 'true') {
              ssl = { rejectUnauthorized: false };
            }
          } catch {
            // ignore parsing errors; will still pass url below
          }

          return {
            type: 'postgres',
            url: databaseUrl,
            ssl,
            synchronize: true,
            logging: true,
            entities: [User, Organization, Role, Permission, Task, UserRole, AuditLog],
          };
        }

        throw new Error(`Unsupported DATABASE_URL scheme: ${databaseUrl}`);
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
